import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { generateStreamToken, verifyStreamToken } from '../services/token.service.js';
import { getDriveClient } from '../config/google.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parseVideoSource } from '../services/video-metadata.service.js';

interface DriveMetadata { fileSize: number; mimeType: string; expiresAt: number }
const driveMetadataCache = new Map<string, DriveMetadata>();
const DRIVE_METADATA_TTL_MS = 5 * 60 * 1000;

async function getCachedDriveMetadata(fileId: string): Promise<DriveMetadata> {
  const cached = driveMetadataCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) return cached;
  const response = await getDriveClient().files.get({ fileId, fields: 'size,mimeType', supportsAllDrives: true });
  const fileSize = Number(response.data.size || 0);
  const mimeType = response.data.mimeType || '';
  if (!Number.isFinite(fileSize) || fileSize <= 0 || !mimeType.startsWith('video/')) throw new Error('Drive video metadata is invalid');
  const metadata = { fileSize, mimeType, expiresAt: Date.now() + DRIVE_METADATA_TTL_MS };
  driveMetadataCache.set(fileId, metadata);
  return metadata;
}

interface TokenControllerDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  generateStreamToken: typeof generateStreamToken;
  createCorrelationId: () => string;
}

const tokenControllerDependencies: TokenControllerDependencies = {
  getSupabaseAdmin,
  generateStreamToken,
  createCorrelationId: randomUUID,
};

// Generate a signed streaming token for a video lesson
export const createGenerateToken = (dependencies: TokenControllerDependencies) => async (req: Request, res: Response): Promise<void> => {
  const correlationId = dependencies.createCorrelationId();
  res.setHeader('X-Correlation-ID', correlationId);

  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      res.status(400).json({ error: 'Lesson ID is required' });
      return;
    }

    // 1. Verify Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
      return;
    }
    const token = authHeader.split(' ')[1];

    // 2. Setup Supabase Admin Client
    const supabase = dependencies.getSupabaseAdmin();

    // 3. Verify User JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.warn('[VideoController] Invalid or expired user token');
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    // 4. Fetch the lesson and its owning course.
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('video_url, course_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lessonData) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    // 5. Authorize access to this lesson's course, not merely any course.
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('course_id', lessonData.course_id)
      .eq('status', 'active')
      .maybeSingle();

    if (enrollError || !enrollment) {
      console.warn('[VideoController] Course access denied', { correlationId, userId: userData.user.id });
      res.status(403).json({ error: 'Forbidden: You do not have access to this content.' });
      return;
    }

    if (!lessonData.video_url) {
      res.status(404).json({ error: 'Lesson video not found' });
      return;
    }

    let fileId: string;
    try {
      const source = parseVideoSource(lessonData.video_url);
      if (source.provider !== 'google_drive' || !source.externalId) throw new Error('Lesson is not a Google Drive video file');
      fileId = source.externalId;
    } catch (cause) {
      res.status(422).json({ error: cause instanceof Error ? cause.message : 'Invalid Google Drive video link.' });
      return;
    }

    // 6. Generate Signed Streaming Token
    // We include only what is necessary: fileId for streaming.
    const streamToken = dependencies.generateStreamToken({ fileId });

    res.status(200).json({ token: streamToken });
  } catch (error: any) {
    console.error('[VideoController] Error generating token', {
      correlationId,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Unable to authorize the video stream.',
      correlationId,
    });
  }
};

export const generateToken = createGenerateToken(tokenControllerDependencies);

function readStreamFileId(req: Request, res: Response): string | null {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ error: 'Missing streaming token' });
    return null;
  }

  try {
    return verifyStreamToken(token).fileId;
  } catch (error: any) {
    console.warn('[StreamVideo] Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid or expired streaming token' });
    return null;
  }
}

export const inspectVideo = async (req: Request, res: Response): Promise<void> => {
  const fileId = readStreamFileId(req, res);
  if (!fileId) return;

  try {
    const { fileSize, mimeType } = await getCachedDriveMetadata(fileId);

    res.status(200).set({
      'Content-Length': String(fileSize),
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    }).end();
  } catch (error: any) {
    console.error('[StreamVideo] Metadata request failed:', error.message);
    const statusCode = error.response?.status;
    res.status(statusCode === 403 || statusCode === 404 || statusCode === 429 ? statusCode : 502).end();
  }
};

export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  const fileId = readStreamFileId(req, res);
  if (!fileId) return;

  // 3. Setup AbortController to handle client disconnects
  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      console.log(`[StreamVideo] Client connection closed before completion. Aborting stream.`);
      abortController.abort();
    }
  });

  // 4. Fetch File Metadata & Stream
  try {
    const drive = getDriveClient();

    const { fileSize, mimeType } = await getCachedDriveMetadata(fileId);

    const range = req.headers.range;

    if (range) {
      // Handle Range Request (206)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = fileSize - 1;

      if (parts[1] && parts[1].trim() !== '') {
        const parsedEnd = parseInt(parts[1], 10);
        if (!isNaN(parsedEnd)) {
          end = parsedEnd;
        }
      }

      if (isNaN(start) || start >= fileSize || start > end) {
        res.status(416).header('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;

      const streamResponse = await drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        {
          responseType: 'stream',
          headers: { Range: `bytes=${start}-${end}` },
          signal: abortController.signal as any,
        }
      );

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
      });

      console.log(`[StreamVideo] Starting stream (206) for range: ${start}-${end}`);

      streamResponse.data.on('end', () => {
        console.log(`[StreamVideo] Stream completed for range: ${start}-${end}`);
      });

      streamResponse.data.on('error', (err: any) => {
        if (err.name === 'AbortError' || err.message === 'canceled') {
          // Expected on client disconnect
        } else {
          console.error('[StreamVideo] Upstream error during range stream:', err.message);
          if (!res.headersSent) res.status(500).end();
        }
      });

      streamResponse.data.pipe(res);
    } else {
      // Handle Initial Request without Range (200)
      const streamResponse = await drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        {
          responseType: 'stream',
          signal: abortController.signal as any,
        }
      );

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });

      console.log(`[StreamVideo] Starting full stream (200)`);

      streamResponse.data.on('end', () => {
        console.log(`[StreamVideo] Full stream completed.`);
      });

      streamResponse.data.on('error', (err: any) => {
        if (err.name === 'AbortError' || err.message === 'canceled') {
          // Expected
        } else {
          console.error('[StreamVideo] Upstream error during full stream:', err.message);
          if (!res.headersSent) res.status(500).end();
        }
      });

      streamResponse.data.pipe(res);
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('canceled')) {
      return;
    }

    console.error('[StreamVideo] External API or configuration failure:', error.message);

    const statusCode = error.response?.status || 500;

    if (statusCode === 403 || statusCode === 429) {
      console.error('[StreamVideo] Rate limit or quota exceeded on upstream API.');
      if (!res.headersSent) res.status(statusCode).json({ error: 'Media source unavailable. Please try again later.' });
    } else if (statusCode === 404) {
      console.error('[StreamVideo] Media file not found upstream.');
      if (!res.headersSent) res.status(404).json({ error: 'Media not found.' });
    } else {
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream media.' });
    }
  }
};

import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { generateStreamToken, verifyStreamToken } from '../services/token.service.js';
import { getDriveClient } from '../config/google.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parseVideoSource } from '../services/video-metadata.service.js';

interface DriveMetadata { fileSize: number; mimeType: string; expiresAt: number }
const driveMetadataCache = new Map<string, DriveMetadata>();
const DRIVE_METADATA_TTL_MS = 5 * 60 * 1000;
export const HOMEPAGE_INTRO_FILE_ID = '1Dbt6IIl0vLQYlXcuKE4_Vkkja-JYB9EC';

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
    const { lessonId, asset, courseId } = req.body;

    if (asset === 'homepage-intro') {
      const streamToken = dependencies.generateStreamToken({ fileId: HOMEPAGE_INTRO_FILE_ID, resourceType: 'video' });
      res.status(200).json({ token: streamToken });
      return;
    }

    if (asset === 'course-trailer') {
      if (!courseId) {
        res.status(400).json({ error: 'A course is required for this trailer' });
        return;
      }
      const supabase = dependencies.getSupabaseAdmin();
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('trailer_video')
        .eq('id', courseId)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .maybeSingle();
      if (courseError || !course?.trailer_video) {
        res.status(404).json({ error: 'Course trailer not found' });
        return;
      }
      try {
        const source = parseVideoSource(course.trailer_video);
        if (source.provider !== 'google_drive' || !source.externalId) throw new Error('Course trailer is not a Google Drive video file');
        res.status(200).json({ token: dependencies.generateStreamToken({ fileId: source.externalId, resourceType: 'video' }) });
      } catch (cause) {
        res.status(422).json({ error: cause instanceof Error ? cause.message : 'Invalid Google Drive video link.' });
      }
      return;
    }

    if (!lessonId) {
      res.status(400).json({ error: 'A valid video target is required' });
      return;
    }

    // 1. Fetch the lesson and its public-course context before deciding whether
    // enrollment is required. Free previews are deliberately accessible to visitors.
    const supabase = dependencies.getSupabaseAdmin();
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('video_url, course_id, section_id, is_preview, is_published, deleted_at')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lessonData || lessonData.deleted_at || !lessonData.is_published) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    let isPublicPreview = false;
    if (lessonData.is_preview) {
      const [{ data: course }, { data: section }] = await Promise.all([
        supabase.from('courses').select('id').eq('id', lessonData.course_id).eq('status', 'published').eq('visibility', 'public').maybeSingle(),
        supabase.from('course_sections').select('id').eq('id', lessonData.section_id).eq('course_id', lessonData.course_id).eq('is_published', true).is('deleted_at', null).maybeSingle(),
      ]);
      isPublicPreview = Boolean(course && section);
    }

    if (!isPublicPreview) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
        return;
      }
      const token = authHeader.split(' ')[1];
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        console.warn('[VideoController] Invalid or expired user token');
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
      }

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

    // Generate a short-lived token after either public-preview or enrollment authorization.
    // We include only what is necessary: fileId for streaming.
    const streamToken = dependencies.generateStreamToken({ fileId, resourceType: 'video' });

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
    const payload = verifyStreamToken(token);
    if (payload.resourceType !== 'video') throw new Error('Token is not valid for video streaming');
    return payload.fileId;
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

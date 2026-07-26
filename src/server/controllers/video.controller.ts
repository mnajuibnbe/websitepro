import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { generateStreamToken, verifyStreamToken } from '../services/token.service.js';
import { getDriveClient } from '../config/google.js';
import { getSupabaseAdmin } from '../config/supabase.js';

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

    let fileId = lessonData.video_url;

    // Extract the clean 32-character Google Drive file ID if a full URL is provided
    if (fileId.includes('drive.google.com') || fileId.includes('docs.google.com')) {
      const match = fileId.match(/[-\w]{25,}/);
      if (match) {
        fileId = match[0];
      }
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

export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  // 1. Extract Token from Query Params
  const token = req.query.token as string;
  if (!token) {
    console.warn('[StreamVideo] Missing token in request');
    res.status(401).json({ error: 'Missing streaming token' });
    return;
  }

  // 2. Verify Token
  let fileId: string;
  try {
    const decoded = verifyStreamToken(token);
    fileId = decoded.fileId;
  } catch (error: any) {
    console.warn('[StreamVideo] Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid or expired streaming token' });
    return;
  }

  // 3. Setup AbortController to handle client disconnects
  const abortController = new AbortController();
  req.on('close', () => {
    console.log(`[StreamVideo] Client connection closed. Aborting stream.`);
    abortController.abort();
  });

  // 4. Fetch File Metadata & Stream
  try {
    const drive = getDriveClient();

    // Get File Metadata
    const metadataResponse = await drive.files.get(
      {
        fileId,
        fields: 'size, mimeType',
        supportsAllDrives: true,
      },
      { signal: abortController.signal as any }
    );

    const fileSize = parseInt(metadataResponse.data.size || '0', 10);
    const mimeType = metadataResponse.data.mimeType || 'video/mp4';

    if (isNaN(fileSize) || fileSize === 0) {
      console.error('[StreamVideo] Invalid file size returned from Google Drive');
      res.status(500).json({ error: 'Failed to retrieve media information' });
      return;
    }

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

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'no-store', // Prevent caching
      });

      console.log(`[StreamVideo] Starting stream (206) for range: ${start}-${end}`);

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
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });

      console.log(`[StreamVideo] Starting full stream (200)`);

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

import { Request, Response } from 'express';
import { generateStreamToken, verifyStreamToken } from '../services/token.service';
import { getDriveClient } from '../config/google';
import { getSupabaseAdmin } from '../config/supabase';

// Generate a signed streaming token for a video lesson
export const generateToken = async (req: Request, res: Response): Promise<void> => {
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
    const supabase = getSupabaseAdmin();
    
    // 3. Verify User JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.warn('[VideoController] Invalid or expired user token');
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    // 4. Verify Enrollment (Authorization)
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    // Since we don't have a direct mapping from lessonId -> courseId in the request easily,
    // and lessons are shared across courses in this simplified model, we just ensure 
    // the user has at least one active enrollment to view content.
    // In a production app, we would verify: lesson -> chapter -> course -> enrollment
    if (enrollError || !enrollment) {
      console.warn('[VideoController] User not enrolled or enrollment inactive', userData.user.id);
      res.status(403).json({ error: 'Forbidden: You do not have access to this content.' });
      return;
    }

    // 5. Fetch File ID for the Lesson from the database
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('video_url') // We store Google Drive file ID in video_url
      .eq('id', lessonId)
      .single();

    if (lessonError || !lessonData || !lessonData.video_url) {
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
    const streamToken = generateStreamToken({ fileId });

    res.status(200).json({ token: streamToken });
  } catch (error: any) {
    console.error('[VideoController] Error generating token:', error.message, error.code, error.status, error.stack);
    res.status(500).json({ 
      error: 'Failed to generate token', 
      originalError: error.message
    });
  }
};

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

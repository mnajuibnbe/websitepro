import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { getDriveClient } from '../config/google.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parseGoogleDriveFileId } from '../services/google-drive-file.service.js';
import { generateStreamToken, verifyStreamToken } from '../services/token.service.js';

interface DocumentTokenDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  generateStreamToken: typeof generateStreamToken;
  getDriveMetadata: (fileId: string) => Promise<{ mimeType: string | null; size: string | null; name: string | null }>;
  createCorrelationId: () => string;
}

const dependencies: DocumentTokenDependencies = {
  getSupabaseAdmin,
  generateStreamToken,
  getDriveMetadata: async (fileId) => {
    const response = await getDriveClient().files.get({ fileId, fields: 'mimeType,size,name', supportsAllDrives: true });
    return { mimeType: response.data.mimeType || null, size: response.data.size || null, name: response.data.name || null };
  },
  createCorrelationId: randomUUID,
};

export const createDocumentToken = (deps: DocumentTokenDependencies) => async (req: Request, res: Response): Promise<void> => {
  const correlationId = deps.createCorrelationId();
  res.setHeader('X-Correlation-ID', correlationId);

  try {
    const lessonId = typeof req.body?.lessonId === 'string' ? req.body.lessonId : '';
    const authHeader = req.headers.authorization;
    if (!lessonId) {
      res.status(400).json({ error: 'Lesson ID is required' });
      return;
    }
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
      return;
    }

    const supabase = deps.getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.slice(7));
    if (userError || !userData?.user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('content_url,content_type,lesson_type,course_id,is_published,deleted_at')
      .eq('id', lessonId)
      .single();
    if (lessonError || !lesson || lesson.deleted_at || !lesson.is_published) {
      res.status(404).json({ error: 'Published PDF lesson not found' });
      return;
    }
    if (lesson.content_type !== 'pdf' && lesson.lesson_type !== 'pdf') {
      res.status(422).json({ error: 'This lesson is not a PDF document' });
      return;
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('course_id', lesson.course_id)
      .eq('status', 'active')
      .maybeSingle();
    if (enrollmentError || !enrollment) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this content.' });
      return;
    }

    const fileId = parseGoogleDriveFileId(lesson.content_url || '');
    const metadata = await deps.getDriveMetadata(fileId);
    if (metadata.mimeType !== 'application/pdf' || !Number.isFinite(Number(metadata.size)) || Number(metadata.size) <= 0) {
      res.status(422).json({ error: 'The Google Drive file is not a readable PDF.' });
      return;
    }

    res.status(200).json({ token: deps.generateStreamToken({ fileId, resourceType: 'pdf' }) });
  } catch (error: any) {
    console.error('[DocumentController] Failed to authorize document', { correlationId, message: error.message, code: error.code });
    const upstreamStatus = error.response?.status;
    if (upstreamStatus === 403 || upstreamStatus === 404) {
      res.status(422).json({ error: 'The PDF is unavailable to the configured service account.', correlationId });
      return;
    }
    res.status(500).json({ error: 'Unable to authorize the PDF document.', correlationId });
  }
};

export const generateDocumentToken = createDocumentToken(dependencies);

function readPdfFileId(req: Request, res: Response): string | null {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    res.status(401).json({ error: 'Missing document token' });
    return null;
  }
  try {
    const payload = verifyStreamToken(token);
    if (payload.resourceType !== 'pdf') throw new Error('Token is not valid for PDF access');
    return payload.fileId;
  } catch {
    res.status(401).json({ error: 'Invalid or expired document token' });
    return null;
  }
}

async function getPdfMetadata(fileId: string) {
  const response = await getDriveClient().files.get({ fileId, fields: 'mimeType,size,name', supportsAllDrives: true });
  const size = Number(response.data.size || 0);
  if (response.data.mimeType !== 'application/pdf' || !Number.isFinite(size) || size <= 0) throw new Error('Invalid PDF metadata');
  return { size, name: response.data.name || 'lesson.pdf' };
}

function safeFilename(name: string) {
  return name.replace(/["\\\r\n]/g, '_').slice(0, 180) || 'lesson.pdf';
}

export const inspectDocument = async (req: Request, res: Response): Promise<void> => {
  const fileId = readPdfFileId(req, res);
  if (!fileId) return;
  try {
    const { size, name } = await getPdfMetadata(fileId);
    res.status(200).set({
      'Content-Length': String(size),
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeFilename(name)}"`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    }).end();
  } catch {
    res.status(502).end();
  }
};

export const streamDocument = async (req: Request, res: Response): Promise<void> => {
  const fileId = readPdfFileId(req, res);
  if (!fileId) return;
  const abortController = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abortController.abort(); });

  try {
    const { size, name } = await getPdfMetadata(fileId);
    const rangeMatch = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start = 0;
    let end = size - 1;
    if (req.headers.range && !rangeMatch) {
      res.status(416).set('Content-Range', `bytes */${size}`).end();
      return;
    }
    if (rangeMatch) {
      start = Number(rangeMatch[1]);
      end = rangeMatch[2] ? Math.min(Number(rangeMatch[2]), size - 1) : size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
        res.status(416).set('Content-Range', `bytes */${size}`).end();
        return;
      }
    }

    const response = await getDriveClient().files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream', headers: rangeMatch ? { Range: `bytes=${start}-${end}` } : undefined, signal: abortController.signal as any },
    );
    const headers: Record<string, string | number> = {
      'Content-Length': end - start + 1,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeFilename(name)}"`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    };
    if (rangeMatch) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    res.writeHead(rangeMatch ? 206 : 200, headers);
    response.data.on('error', (error: any) => {
      if (error.name !== 'AbortError' && !res.headersSent) res.status(502).end();
    });
    response.data.pipe(res);
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('canceled')) return;
    if (!res.headersSent) res.status(error.response?.status === 404 ? 404 : 502).json({ error: 'Failed to load the PDF document.' });
  }
};

import { Router } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { resolveVideoMetadata } from '../services/video-metadata.service.js';

const router = Router();

router.post('/video-metadata', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !data.user) { res.status(401).json({ error: 'Invalid session.' }); return; }
  const role = data.user.app_metadata?.role;
  if (role !== 'admin' && role !== 'instructor') {
    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
    if (profile?.role !== 'admin' && profile?.role !== 'instructor') { res.status(403).json({ error: 'Course author access required.' }); return; }
  }
  if (typeof req.body?.url !== 'string' || req.body.url.length > 2048) { res.status(400).json({ error: 'A valid video URL is required.' }); return; }
  try {
    const metadata = await resolveVideoMetadata(req.body.url, { youtubeApiKey: process.env.YOUTUBE_DATA_API_KEY });
    res.json(metadata);
  } catch (cause) {
    res.status(422).json({ error: cause instanceof Error ? cause.message : 'Video metadata could not be loaded.' });
  }
});

export default router;

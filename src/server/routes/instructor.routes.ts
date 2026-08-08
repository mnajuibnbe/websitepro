import { Router } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';

const router = Router();

router.post('/invite', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const admin = getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(authHeader.slice(7));
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session.' }); return; }
  const { data: profile } = await admin.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (auth.user.app_metadata?.role !== 'admin' && profile?.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return; }
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) { res.status(400).json({ error: 'Enter a valid instructor email address.' }); return; }
  const redirectTo = process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, '')}/instructor/apply` : undefined;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { invited_as_instructor: true } });
  if (error) { res.status(error.status === 422 ? 409 : 502).json({ error: error.status === 422 ? 'An account already exists for this email.' : 'The invitation could not be sent.' }); return; }
  res.status(201).json({ message: 'Instructor invitation sent.' });
});

export default router;

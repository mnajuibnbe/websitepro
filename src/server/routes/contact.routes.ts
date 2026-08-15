import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { sendEmail, buildContactConfirmationEmail } from '../services/email.service.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const ALLOWED_TOPICS = ['support', 'billing', 'course', 'other'] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  sendEmail: typeof sendEmail;
}

const dependencies: ContactDependencies = { getSupabaseAdmin, sendEmail };

function normalizeTopic(value: unknown): string {
  return typeof value === 'string' && (ALLOWED_TOPICS as readonly string[]).includes(value) ? value : 'other';
}

export const createContactHandler = (deps: ContactDependencies) => async (req: Request, res: Response): Promise<void> => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phoneRaw = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const topic = normalizeTopic(req.body?.topic);

  if (name.length < 1 || name.length > 200) { res.status(400).json({ error: 'Enter your full name.' }); return; }
  if (!EMAIL_PATTERN.test(email) || email.length > 320) { res.status(400).json({ error: 'Enter a valid email address.' }); return; }
  if (message.length < 1 || message.length > 5000) { res.status(400).json({ error: 'Enter a message.' }); return; }
  if (phoneRaw.length > 40) { res.status(400).json({ error: 'Phone number is too long.' }); return; }
  const phone = phoneRaw.length > 0 ? phoneRaw : null;

  const admin = deps.getSupabaseAdmin();

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { data: recent, error: recentError } = await admin
    .from('contact_submissions')
    .select('id')
    .eq('email', email)
    .gte('created_at', since)
    .limit(1);
  if (recentError) { res.status(500).json({ error: 'Could not submit your message. Please try again.' }); return; }
  if (recent && recent.length > 0) {
    res.status(429).json({ error: 'Please wait a moment before sending another message.' });
    return;
  }

  const { data: submission, error: insertError } = await admin
    .from('contact_submissions')
    .insert({ name, email, phone, topic, message, status: 'received' })
    .select('id')
    .single();
  if (insertError || !submission) {
    res.status(500).json({ error: 'Could not submit your message. Please try again.' });
    return;
  }

  // Email delivery failure does not fail the request: the submission is
  // already durably stored, which is what matters for the visitor's message
  // to reach support. We log the failure and mark the row so it can be
  // spotted and manually followed up on, rather than blocking the
  // user-facing success on a third-party mail provider being reachable.
  const { subject, html, text } = buildContactConfirmationEmail(name);
  const emailResult = await deps.sendEmail({ to: email, subject, html, text });
  if (!emailResult.sent) {
    console.error('[Contact] confirmation email failed', { submissionId: submission.id, error: emailResult.error });
    await admin.from('contact_submissions').update({ status: 'email_failed' }).eq('id', submission.id);
  }

  res.status(201).json({ id: submission.id });
};

const router = Router();
router.post('/', createContactHandler(dependencies));
export default router;

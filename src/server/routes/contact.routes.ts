import { Router, type Request, type Response, type NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { sendEmail, buildContactConfirmationEmail, buildContactReplyEmail, buildReplyToAddress } from '../services/email.service.js';
import { createFixedWindowLimiter } from '../services/rateLimiter.util.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const ALLOWED_TOPICS = ['support', 'billing', 'course', 'other'] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ContactDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  sendEmail: typeof sendEmail;
}

const dependencies: ContactDependencies = { getSupabaseAdmin, sendEmail };

function normalizeTopic(value: unknown): string {
  return typeof value === 'string' && (ALLOWED_TOPICS as readonly string[]).includes(value) ? value : 'other';
}

/** Visible text length ignoring markup -- enough to reject an empty/whitespace-only rich text reply. */
function visibleHtmlLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().length;
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

/**
 * Admin-only: reply to a visitor's submission by email. Unlike the
 * confirmation email above, a failed send here does fail the request (502)
 * -- there's no fallback value in reporting success when the one thing the
 * admin asked for (the reply reaching the visitor) didn't happen. The reply
 * is still saved either way so the draft isn't lost and it's visible in the
 * thread with its failed status.
 */
export const createContactReplyHandler = (deps: ContactDependencies) => async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const admin = deps.getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(authHeader.slice(7));
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session.' }); return; }
  const { data: profile } = await admin.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (auth.user.app_metadata?.role !== 'admin' && profile?.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return; }

  const submissionId = req.params.id;
  if (!UUID_PATTERN.test(submissionId)) { res.status(400).json({ error: 'Invalid submission ID.' }); return; }

  const messageHtml = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (visibleHtmlLength(messageHtml) < 1 || messageHtml.length > 10000) { res.status(400).json({ error: 'Enter a reply message.' }); return; }

  const { data: submissionRow, error: fetchError } = await admin
    .from('contact_submissions')
    .select('name, email, message, read_at')
    .eq('id', submissionId)
    .maybeSingle();
  if (fetchError) { res.status(500).json({ error: 'Could not load this submission.' }); return; }
  if (!submissionRow) { res.status(404).json({ error: 'Submission not found.' }); return; }

  const { subject, html, text } = buildContactReplyEmail(submissionRow.name, submissionRow.message, messageHtml);
  const emailResult = await deps.sendEmail({ to: submissionRow.email, subject, html, text, replyTo: buildReplyToAddress(submissionId) });

  const { data: reply, error: replyInsertError } = await admin
    .from('contact_submission_replies')
    .insert({
      submission_id: submissionId,
      admin_id: auth.user.id,
      sender_type: 'admin',
      message_html: messageHtml,
      is_html: true,
      email_status: emailResult.sent ? 'sent' : 'failed',
      email_error: emailResult.sent ? null : (emailResult.error?.slice(0, 500) || null),
    })
    .select('id')
    .single();
  if (replyInsertError || !reply) { res.status(500).json({ error: 'Could not save this reply.' }); return; }

  const now = new Date().toISOString();
  await admin
    .from('contact_submissions')
    .update({ replied_at: now, ...(submissionRow.read_at ? {} : { read_at: now }) })
    .eq('id', submissionId);

  if (!emailResult.sent) {
    console.error('[Contact] reply email failed', { submissionId, replyId: reply.id, error: emailResult.error });
    res.status(502).json({ error: 'The reply was saved but could not be emailed. Please retry.', id: reply.id });
    return;
  }

  res.status(201).json({ id: reply.id });
};

// Per-email rate limiting above (createContactHandler) stops the same
// address from being spammed, but does nothing against a script that
// rotates fake addresses from one source -- each submission still costs a
// DB row and an outbound confirmation email. This per-IP layer catches
// that: generous enough for a real visitor who mistypes and resubmits, tight
// enough to blunt a flood.
const isAllowedByContactRateLimit = createFixedWindowLimiter(10 * 60_000, 20);

function contactIpRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  if (!isAllowedByContactRateLimit(ip)) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }
  next();
}

const router = Router();
router.post('/', contactIpRateLimit, createContactHandler(dependencies));
router.post('/:id/reply', createContactReplyHandler(dependencies));
export default router;

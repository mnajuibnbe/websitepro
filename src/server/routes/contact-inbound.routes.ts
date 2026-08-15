import { Router, type Request, type Response } from 'express';
import express from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { fetchReceivedEmail, htmlToPlainText, type ReceivedEmail } from '../services/email.service.js';
import { verifyResendWebhookSignature } from '../services/resendWebhook.util.js';
import { stripQuotedReply } from '../services/emailQuote.util.js';
import { createFixedWindowLimiter } from '../services/rateLimiter.util.js';

const REPLY_TOKEN_PATTERN = /^reply\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i;

// Generous relative to Resend's real traffic for a single-tenant support
// inbox -- this is defense-in-depth against a flood of unsigned requests,
// not a throughput limit for legitimate webhook deliveries.
const isAllowedByRateLimit = createFixedWindowLimiter(60_000, 60);

interface InboundDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  fetchReceivedEmail: typeof fetchReceivedEmail;
  verifySignature: typeof verifyResendWebhookSignature;
}

const dependencies: InboundDependencies = { getSupabaseAdmin, fetchReceivedEmail, verifySignature: verifyResendWebhookSignature };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_VISITOR_EMAIL = 'unknown-sender@invalid.local';

/**
 * Extracts a bare address from a "Name <addr>" From header. Falls back to a
 * placeholder that still satisfies the DB's email-format CHECK constraint
 * if the header is missing or malformed -- without this, a webhook delivery
 * with an unparseable From header would hit a constraint violation on every
 * retry and never get stored.
 */
function extractEmailAddress(headerValue: string): string {
  const angleMatch = headerValue.match(/<([^>]+)>/);
  const candidate = (angleMatch ? angleMatch[1] : headerValue).trim().toLowerCase();
  return EMAIL_PATTERN.test(candidate) ? candidate : FALLBACK_VISITOR_EMAIL;
}

/** Finds the reply+<submission-id>@... token across every address the message was delivered to. */
function findSubmissionId(addressGroups: (string[] | undefined)[]): string | null {
  for (const group of addressGroups) {
    for (const address of group ?? []) {
      const match = REPLY_TOKEN_PATTERN.exec(address.trim());
      if (match) return match[1].toLowerCase();
    }
  }
  return null;
}

function resolveReplyText(email: ReceivedEmail): string {
  const rawText = email.text ?? (email.html ? htmlToPlainText(email.html) : '');
  const stripped = stripQuotedReply(rawText);
  const chosen = stripped.length > 0 ? stripped : rawText.trim();
  return chosen.slice(0, 20000);
}

export const createResendInboundWebhookHandler = (deps: InboundDependencies) => async (req: Request, res: Response): Promise<void> => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

  const verified = deps.verifySignature(rawBody, {
    id: req.header('svix-id'),
    timestamp: req.header('svix-timestamp'),
    signature: req.header('svix-signature'),
  }, process.env.RESEND_WEBHOOK_SECRET);

  if (!verified) {
    console.error('[ContactInbound] rejected webhook: signature verification failed');
    res.status(401).json({ error: 'Invalid signature.' });
    return;
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Malformed payload.' });
    return;
  }

  // Ack and drop anything that isn't the event this endpoint is built for --
  // avoids needless retries if the dashboard is ever subscribed to more
  // events than intended.
  if (payload.type !== 'email.received' || !payload.data) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const data = payload.data;
  const emailId = typeof data.email_id === 'string' ? data.email_id : null;
  if (!emailId) {
    res.status(400).json({ error: 'Missing email_id.' });
    return;
  }

  const submissionId = findSubmissionId([
    data.to as string[] | undefined,
    data.cc as string[] | undefined,
    data.received_for as string[] | undefined,
  ]);

  if (!submissionId) {
    console.warn('[ContactInbound] no reply token match, dropping', { emailId, to: data.to });
    res.status(200).json({ ok: true, unmatched: true });
    return;
  }

  const email = await deps.fetchReceivedEmail(emailId);
  if (!email) {
    console.error('[ContactInbound] failed to fetch received email body', { emailId });
    res.status(502).json({ error: 'Could not retrieve email content.' });
    return;
  }

  const admin = deps.getSupabaseAdmin();
  const { data: inserted, error: insertError } = await admin
    .from('contact_submission_replies')
    .upsert({
      submission_id: submissionId,
      sender_type: 'visitor',
      admin_id: null,
      visitor_email: extractEmailAddress(email.from || 'unknown@unknown.invalid'),
      message_html: resolveReplyText(email) || '(No message content)',
      is_html: false,
      resend_email_id: emailId,
      attachment_count: email.attachments.length,
      email_status: null,
      email_error: null,
    }, { onConflict: 'resend_email_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle();

  if (insertError) {
    // Foreign key violation means the reply+<id> token doesn't match any
    // real submission (stale/forged token) -- nothing to retry, ack it.
    if (insertError.code === '23503') {
      console.warn('[ContactInbound] reply token referenced an unknown submission', { emailId, submissionId });
      res.status(200).json({ ok: true, unmatched: true });
      return;
    }
    console.error('[ContactInbound] failed to store visitor reply', { emailId, submissionId, error: insertError.message });
    res.status(500).json({ error: 'Could not store the reply.' });
    return;
  }

  // A duplicate delivery of an email we already stored -- ignoreDuplicates
  // means no row comes back. Idempotent no-op.
  if (!inserted) {
    res.status(200).json({ ok: true, duplicate: true });
    return;
  }

  // Flag the thread as needing attention again and reopen it if it had
  // been marked resolved.
  await admin
    .from('contact_submissions')
    .update({ read_at: null, resolved_at: null })
    .eq('id', submissionId);

  res.status(200).json({ ok: true, id: inserted.id });
};

const router = Router();
router.post(
  '/resend-inbound',
  express.raw({ type: '*/*', limit: '5mb' }),
  (req: Request, res: Response, next) => {
    const ip = req.ip || 'unknown';
    if (!isAllowedByRateLimit(ip)) {
      res.status(429).json({ error: 'Too many requests.' });
      return;
    }
    next();
  },
  createResendInboundWebhookHandler(dependencies),
);

export default router;

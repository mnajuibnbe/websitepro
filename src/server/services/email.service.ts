const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_RECEIVING_API_URL = 'https://api.resend.com/emails/receiving';
const DEFAULT_FROM = 'Tutiba Support <support@tutiba.com>';
const BRAND_ACCENT = '#0D9488';
const SUPPORT_REPLY_TO = 'support@tutiba.com';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailSendResult {
  sent: boolean;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_EMAIL_FROM || DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { sent: false, error: `Resend API error (${response.status}): ${body.slice(0, 500)}` };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Unknown email send failure' };
  }
}

/**
 * Shared branded shell (table-based layout, inline styles only) so the
 * confirmation and reply emails render consistently across mail clients,
 * most of which strip <style> blocks and modern CSS.
 */
function wrapEmailHtml(bodyHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F6F5; padding: 32px 16px; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E4E9E8;">
      <tr><td style="background-color: ${BRAND_ACCENT}; padding: 24px 32px;">
        <span style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.05em;">TUTIBA</span>
      </td></tr>
      <tr><td style="padding: 32px;">${bodyHtml}</td></tr>
      <tr><td style="padding: 20px 32px; background-color: #F9FAFA; border-top: 1px solid #E4E9E8;">
        <p style="margin: 0; font-size: 13px; color: #6B7280;">Tutiba &middot; Evidence-based cosmeceutical education</p>
        <p style="margin: 4px 0 0; font-size: 13px;"><a href="mailto:support@tutiba.com" style="color: ${BRAND_ACCENT}; text-decoration: none;">support@tutiba.com</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>`.trim();
}

export function buildContactConfirmationEmail(name: string): { subject: string; html: string; text: string } {
  const subject = 'We received your message — Tutiba';
  const firstName = name.trim().split(/\s+/)[0] || 'there';
  const body = `
    <h1 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Thank you, ${escapeHtml(firstName)}.</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">We've received your message and a member of the Tutiba support team will respond as soon as possible.</p>
    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">If your question is urgent, you can also reach us directly at
      <a href="mailto:support@tutiba.com" style="color: ${BRAND_ACCENT};">support@tutiba.com</a>.
    </p>
  `.trim();
  const html = wrapEmailHtml(body);
  const text = `Thank you, ${firstName}.\n\nWe've received your message and a member of the Tutiba support team will respond as soon as possible.\n\nIf your question is urgent, you can also reach us directly at support@tutiba.com.\n\n— The Tutiba Team`;
  return { subject, html, text };
}

/**
 * The admin's replyHtml is expected to already be sanitized to the shared
 * rich-text allowlist (p/strong/em/ol/ul/li) by the RichTextEditor that
 * produced it -- see src/lib/richTextHtml.ts's sanitizeRichText, which the
 * dashboard composer runs on every keystroke before this ever leaves the
 * browser.
 */
export function buildContactReplyEmail(name: string, originalMessage: string, replyHtml: string): { subject: string; html: string; text: string } {
  const subject = 'Re: your message to Tutiba support';
  const firstName = name.trim().split(/\s+/)[0] || 'there';
  const body = `
    <h1 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Hi ${escapeHtml(firstName)},</h1>
    <div style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #374151;">${replyHtml}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left: 3px solid #E4E9E8; margin: 0 0 8px;">
      <tr><td style="padding: 4px 0 4px 16px;">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF;">Your original message</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6B7280; white-space: pre-wrap;">${escapeHtml(originalMessage)}</p>
      </td></tr>
    </table>
  `.trim();
  const html = wrapEmailHtml(body);
  const text = `Hi ${firstName},\n\n${htmlToPlainText(replyHtml)}\n\n---\nYour original message:\n${originalMessage}`;
  return { subject, html, text };
}

/**
 * Reply-To address for an outbound admin reply. When RESEND_INBOUND_DOMAIN
 * is configured (the Resend-provided <id>.resend.app address -- see Resend
 * dashboard > Emails > Receiving), encodes the submission id into the local
 * part so an inbound visitor reply can be matched back to its thread without
 * relying on sender-address matching (which breaks if the visitor replies
 * from a different address). Falls back to the static support address so
 * outbound replies keep working before inbound is configured.
 */
export function buildReplyToAddress(submissionId: string): string {
  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN?.trim();
  return inboundDomain ? `reply+${submissionId}@${inboundDomain}` : SUPPORT_REPLY_TO;
}

export interface ReceivedEmail {
  id: string;
  to: string[];
  cc: string[];
  from: string;
  subject: string;
  html: string | null;
  text: string | null;
  attachments: { id: string; filename: string }[];
}

/**
 * Fetches the full body of an inbound email. The email.received webhook
 * payload is metadata-only (no body/headers/attachments) by Resend's
 * design, so this is a required second call for every inbound message.
 */
export async function fetchReceivedEmail(emailId: string): Promise<ReceivedEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${RESEND_RECEIVING_API_URL}/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[Email] failed to fetch received email', { emailId, status: response.status, body: body.slice(0, 500) });
    return null;
  }

  const data = await response.json() as Partial<ReceivedEmail> & { to?: unknown; cc?: unknown; attachments?: unknown };
  return {
    id: emailId,
    to: Array.isArray(data.to) ? data.to.filter((v): v is string => typeof v === 'string') : [],
    cc: Array.isArray(data.cc) ? data.cc.filter((v): v is string => typeof v === 'string') : [],
    from: typeof data.from === 'string' ? data.from : '',
    subject: typeof data.subject === 'string' ? data.subject : '',
    html: typeof data.html === 'string' ? data.html : null,
    text: typeof data.text === 'string' ? data.text : null,
    attachments: Array.isArray(data.attachments)
      ? data.attachments.filter((a): a is { id: string; filename: string } => !!a && typeof a === 'object')
      : [],
  };
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] as string));
}

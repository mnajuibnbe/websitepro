const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Tutiba Support <support@tutiba.com>';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
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

export function buildContactConfirmationEmail(name: string): { subject: string; html: string; text: string } {
  const subject = 'We received your message — Tutiba';
  const firstName = name.trim().split(/\s+/)[0] || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #111827;">Thank you, ${escapeHtml(firstName)}.</h2>
      <p>We've received your message and a member of the Tutiba support team will respond as soon as possible.</p>
      <p>If your question is urgent, you can also reach us directly at
        <a href="mailto:support@tutiba.com" style="color: #2563eb;">support@tutiba.com</a>.
      </p>
      <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">— The Tutiba Team</p>
    </div>
  `.trim();
  const text = `Thank you, ${firstName}.\n\nWe've received your message and a member of the Tutiba support team will respond as soon as possible.\n\nIf your question is urgent, you can also reach us directly at support@tutiba.com.\n\n— The Tutiba Team`;
  return { subject, html, text };
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

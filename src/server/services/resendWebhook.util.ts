import { createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_TOLERANCE_SECONDS = 5 * 60;

export interface SvixHeaders {
  id: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
}

/**
 * Verifies a Resend webhook request using Resend's Svix-format signing
 * scheme: HMAC-SHA256 of "{svix-id}.{svix-timestamp}.{raw-body}" using the
 * base64 portion of the whsec_ secret as the key, compared (constant-time)
 * against each space-delimited "v1,<base64>" value in svix-signature. See
 * https://docs.svix.com/receiving/verifying-payloads/how-manual. The raw
 * body must be the exact bytes Resend sent -- this must run before any JSON
 * parsing/re-serialization touches it, or the signature will never match.
 */
export function verifyResendWebhookSignature(
  rawBody: Buffer,
  headers: SvixHeaders,
  secret: string | undefined,
): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;

  const timestampSeconds = Number(headers.timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > REPLAY_TOLERANCE_SECONDS) return false;

  const secretKey = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody.toString('utf8')}`;
  const expected = createHmac('sha256', secretKey).update(signedContent, 'utf8').digest();

  const candidates = headers.signature.split(' ').map((part) => part.trim()).filter(Boolean);
  for (const candidate of candidates) {
    const base64 = candidate.startsWith('v1,') ? candidate.slice('v1,'.length) : candidate;
    let candidateBuf: Buffer;
    try {
      candidateBuf = Buffer.from(base64, 'base64');
    } catch {
      continue;
    }
    if (candidateBuf.length === expected.length && timingSafeEqual(candidateBuf, expected)) {
      return true;
    }
  }
  return false;
}

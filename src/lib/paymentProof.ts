import type { PricingCurrency } from './pricing';

export type PaymentMethod = 'bank_transfer' | 'instapay' | 'vodafone_cash';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  instapay: 'InstaPay',
  vodafone_cash: 'Vodafone Cash',
};

// Mirrors the methods PaymentInstructions actually displays per currency —
// international (USD) orders only ever show a bank transfer option.
export function getAvailablePaymentMethods(currency: PricingCurrency): PaymentMethod[] {
  return currency === 'USD' ? ['bank_transfer'] : ['bank_transfer', 'instapay', 'vodafone_cash'];
}

export const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const REFERENCE_NOTE_MAX_LENGTH = 1000;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PAYMENT_PROOF_ACCEPTED_TYPES = new Set(Object.keys(EXTENSION_BY_MIME));

export function validatePaymentProofFile(file: { type: string; size: number }): string | null {
  if (!PAYMENT_PROOF_ACCEPTED_TYPES.has(file.type)) {
    return 'Choose a JPG, PNG, or WebP image.';
  }
  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return 'The image must be 10 MB or smaller.';
  }
  return null;
}

// Storage RLS requires the object path to start with "<user-id>/" — the
// generated UUID keeps concurrent uploads from the same user collision-free.
export function buildPaymentProofPath(userId: string, mimeType: string): string {
  const extension = EXTENSION_BY_MIME[mimeType] ?? 'bin';
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

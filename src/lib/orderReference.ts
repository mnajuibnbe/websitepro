// Derives a short, typable reference from an order UUID so a student can
// realistically enter it in a bank/InstaPay/Vodafone Cash transfer note.
// Manual transfer notes are free text with no way to look up a full UUID,
// so this trades a little collision risk (~40 bits of entropy) for
// something a human can read back correctly. It is a display aid, not an
// identifier — payment review still reconciles by the full order id.
export function getOrderReference(orderId: string): string {
  const hex = orderId.replace(/-/g, '').toLowerCase().slice(0, 10);
  const code = BigInt(`0x${hex}`).toString(36).toUpperCase().padStart(8, '0').slice(-8);
  return `TUT-${code.slice(0, 4)}-${code.slice(4)}`;
}

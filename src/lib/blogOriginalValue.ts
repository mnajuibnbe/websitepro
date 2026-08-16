import type { OriginalValueSignal } from '../services/blogPosts.service';

/**
 * Original Value Checker: a self-reported checklist, not auto-detection — nothing here
 * inspects the article text. Google's helpful-content guidance rewards content that
 * shows real first-hand experience/expertise; this just gives the writer a place to
 * flag which kinds of original value this specific article actually has.
 */

/** Signals at or above this count are treated as full credit — a soft target, not a hard gate. */
export const ORIGINAL_VALUE_TARGET = 3;

export function originalValueScore(signals: OriginalValueSignal[]): number {
  return Math.min(100, Math.round((signals.length / ORIGINAL_VALUE_TARGET) * 100));
}

/**
 * Minimal in-memory fixed-window rate limiter keyed by an arbitrary string
 * (e.g. request IP). Good enough for a single Node process and low-volume
 * endpoints like a webhook receiver; does not survive a restart or scale
 * across multiple instances, which is an acceptable tradeoff at this
 * project's scale (matching the DB-based per-email limiter already used for
 * the public contact form -- also not distributed).
 */
export function createFixedWindowLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}

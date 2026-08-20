import { Router, type NextFunction, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { buildPageUrl, fetchPagePerformance, type SearchConsolePageType, type SearchConsoleResult } from '../services/searchConsole.service.js';
import { createFixedWindowLimiter } from '../services/rateLimiter.util.js';

/**
 * Admin-only: proxies Search Console performance data (clicks/impressions/CTR/position
 * plus top queries) for a single blog post or course page. Shares the bearer-token-plus-
 * role-check pattern used by contact.routes.ts and blog-insights.routes.ts (no shared
 * "requireAdmin" helper exists elsewhere in this codebase yet).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface SearchConsoleDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  fetchPagePerformance: (pageUrl: string) => Promise<SearchConsoleResult>;
}

const dependencies: SearchConsoleDependencies = { getSupabaseAdmin, fetchPagePerformance };

async function authenticateAdmin(req: Request, res: Response, deps: SearchConsoleDependencies): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return false; }
  const admin = deps.getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(authHeader.slice(7));
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session.' }); return false; }
  const { data: profile } = await admin.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (auth.user.app_metadata?.role !== 'admin' && profile?.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return false; }
  return true;
}

/**
 * Server derives the page URL from a validated type + identifier rather than trusting a
 * client-supplied URL directly -- keeps this admin-only proxy from being usable to probe
 * arbitrary URLs against the site's Search Console property.
 *
 * The whole body is wrapped in try/catch: an async Express handler that rejects (e.g. a
 * Supabase Auth outage inside authenticateAdmin's getUser()/users lookup) isn't caught by
 * this app's global error middleware (server.ts/api/index.ts, which only catches
 * synchronous throws or next(err)), so an uncaught rejection here would otherwise leave
 * the client's fetch hanging until its own timeout instead of showing the panel's error
 * state.
 */
export const createPerformanceHandler = (deps: SearchConsoleDependencies) => async (req: Request, res: Response): Promise<void> => {
  try {
    if (!(await authenticateAdmin(req, res, deps))) return;

    const type = req.query.type;
    if (type !== 'blog_post' && type !== 'course') { res.status(400).json({ error: 'type must be "blog_post" or "course".' }); return; }

    const identifier = typeof req.query.slug === 'string' ? req.query.slug : typeof req.query.id === 'string' ? req.query.id : '';
    if (type === 'course' && !UUID_PATTERN.test(identifier)) { res.status(400).json({ error: 'A valid course id is required.' }); return; }
    if (type === 'blog_post' && (!identifier || !SLUG_PATTERN.test(identifier) || identifier.length > 200)) { res.status(400).json({ error: 'A valid post slug is required.' }); return; }

    const pageUrl = buildPageUrl(type as SearchConsolePageType, identifier);
    const result = await deps.fetchPagePerformance(pageUrl);

    if (!result.ok || !result.data) {
      res.status(503).json({
        error: result.reason === 'missing_credentials' ? 'Search Console is not configured on this server.' : 'Search Console data is temporarily unavailable. Please try again shortly.',
        reason: result.reason || 'api_error',
      });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error('[SearchConsole] performance handler failed unexpectedly', error);
    if (!res.headersSent) res.status(503).json({ error: 'Search Console data is temporarily unavailable. Please try again shortly.', reason: 'api_error' });
  }
};

// Generous enough for normal admin browsing (opening several posts/courses in a
// session) while bounding cost from a runaway client bug -- each cache miss is a real
// Search Console API call against this project's daily quota.
const isAllowedByPerformanceRateLimit = createFixedWindowLimiter(10 * 60_000, 60);

const router = Router();
router.get('/performance', (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  if (!isAllowedByPerformanceRateLimit(key)) { res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' }); return; }
  next();
}, createPerformanceHandler(dependencies));

export default router;

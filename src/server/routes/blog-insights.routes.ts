import { Router, type NextFunction, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { generateTopicInsights, generateMetaDescription, type GeminiInsightsResult, type GeminiMetaDescriptionResult } from '../services/gemini.service.js';
import { createFixedWindowLimiter } from '../services/rateLimiter.util.js';

/**
 * Admin-only: proxies the blog editor's Gemini-backed features (Topic Coverage / Reader
 * Questions, and the automatic meta-description writer). The API key never reaches the
 * browser -- the client only ever calls these routes with plain text. Both handlers
 * share the same bearer-token-plus-role-check pattern used by contact.routes.ts and
 * instructor.routes.ts (no shared "requireAdmin" helper exists elsewhere in this
 * codebase yet, but with two handlers in this one file it's worth not repeating it a
 * third time here).
 */

const MAX_TOPIC_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000; // matches blog_posts.content's own DB length bound
const MAX_TITLE_LENGTH = 180; // matches blog_posts.title's own DB length bound
const MAX_EXCERPT_LENGTH = 600; // matches blog_posts.excerpt's own DB length bound

interface BlogInsightsDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  generateTopicInsights: (topic: string, contentText: string, apiKey: string | undefined) => Promise<GeminiInsightsResult>;
  generateMetaDescription: (title: string, excerpt: string, contentText: string, primaryKeyword: string, apiKey: string | undefined) => Promise<GeminiMetaDescriptionResult>;
}

const dependencies: BlogInsightsDependencies = { getSupabaseAdmin, generateTopicInsights, generateMetaDescription };

async function authenticateAdmin(req: Request, res: Response, deps: BlogInsightsDependencies): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return false; }
  const admin = deps.getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(authHeader.slice(7));
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session.' }); return false; }
  const { data: profile } = await admin.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (auth.user.app_metadata?.role !== 'admin' && profile?.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return false; }
  return true;
}

export const createTopicInsightsHandler = (deps: BlogInsightsDependencies) => async (req: Request, res: Response): Promise<void> => {
  if (!(await authenticateAdmin(req, res, deps))) return;

  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
  const contentText = typeof req.body?.contentText === 'string' ? req.body.contentText : '';
  if (!topic || topic.length > MAX_TOPIC_LENGTH) { res.status(400).json({ error: 'Enter a target topic or search query before analyzing.' }); return; }
  if (contentText.length > MAX_CONTENT_LENGTH) { res.status(400).json({ error: 'Article content is too long to analyze.' }); return; }

  const result = await deps.generateTopicInsights(topic, contentText, process.env.GEMINI_API_KEY);

  if (!result.ok || !result.insights) {
    if (result.reason && result.reason !== 'missing_key') console.error('[BlogInsights] Gemini request failed', { reason: result.reason, message: result.message });
    res.status(503).json({
      error: result.reason === 'missing_key' ? 'AI-assisted insights are not configured on this server.' : 'AI-assisted insights are temporarily unavailable. Please try again shortly.',
      reason: result.reason || 'api_error',
    });
    return;
  }

  res.status(200).json(result.insights);
};

/**
 * Called automatically from the publish flow (see AdminBlogPosts.tsx's save()) -- not a
 * user-facing "Analyze" button like topic-insights, so there's no way for the admin to
 * spam this by clicking. Still rate-limited the same way as a floor against a runaway
 * client bug or a compromised session, since each call is a real, billed Gemini request.
 */
export const createMetaDescriptionHandler = (deps: BlogInsightsDependencies) => async (req: Request, res: Response): Promise<void> => {
  if (!(await authenticateAdmin(req, res, deps))) return;

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const excerpt = typeof req.body?.excerpt === 'string' ? req.body.excerpt.trim() : '';
  const contentText = typeof req.body?.contentText === 'string' ? req.body.contentText : '';
  const primaryKeyword = typeof req.body?.primaryKeyword === 'string' ? req.body.primaryKeyword.trim() : '';
  if (!title || title.length > MAX_TITLE_LENGTH) { res.status(400).json({ error: 'A title is required before generating a meta description.' }); return; }
  if (excerpt.length > MAX_EXCERPT_LENGTH) { res.status(400).json({ error: 'Excerpt is too long.' }); return; }
  if (contentText.length > MAX_CONTENT_LENGTH) { res.status(400).json({ error: 'Article content is too long.' }); return; }

  const result = await deps.generateMetaDescription(title, excerpt, contentText, primaryKeyword, process.env.GEMINI_API_KEY);

  if (!result.ok || !result.description) {
    if (result.reason && result.reason !== 'missing_key') console.error('[BlogInsights] Meta description generation failed', { reason: result.reason, message: result.message });
    res.status(503).json({
      error: result.reason === 'missing_key' ? 'AI meta description writer is not configured on this server.' : 'AI meta description writer is temporarily unavailable.',
      reason: result.reason || 'api_error',
    });
    return;
  }

  res.status(200).json({ description: result.description });
};

// Generous enough for genuine iterative use (draft, revise, re-analyze) while
// bounding cost from a runaway client bug or a compromised admin session --
// each call is a real, billed Gemini request.
const isAllowedByInsightsRateLimit = createFixedWindowLimiter(10 * 60_000, 20);
const isAllowedByMetaDescriptionRateLimit = createFixedWindowLimiter(10 * 60_000, 20);

const router = Router();
router.post('/topic-insights', (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  if (!isAllowedByInsightsRateLimit(key)) { res.status(429).json({ error: 'Too many analysis requests. Please wait a few minutes and try again.' }); return; }
  next();
}, createTopicInsightsHandler(dependencies));
router.post('/meta-description', (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  if (!isAllowedByMetaDescriptionRateLimit(key)) { res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' }); return; }
  next();
}, createMetaDescriptionHandler(dependencies));

export default router;

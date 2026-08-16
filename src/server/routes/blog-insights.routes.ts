import { Router, type NextFunction, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { generateTopicInsights, type GeminiInsightsResult } from '../services/gemini.service.js';
import { createFixedWindowLimiter } from '../services/rateLimiter.util.js';

/**
 * Admin-only: proxies the blog editor's Topic Coverage / Reader Questions panels to
 * Gemini. The API key never reaches the browser -- the client only ever calls this
 * route with the topic and the article's plain-text content, matching the same
 * bearer-token-plus-role-check pattern used by contact.routes.ts and
 * instructor.routes.ts (no shared "requireAdmin" helper exists in this codebase yet).
 */

const MAX_TOPIC_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000; // matches blog_posts.content's own DB length bound

interface BlogInsightsDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  generateTopicInsights: (topic: string, contentText: string, apiKey: string | undefined) => Promise<GeminiInsightsResult>;
}

const dependencies: BlogInsightsDependencies = { getSupabaseAdmin, generateTopicInsights };

export const createTopicInsightsHandler = (deps: BlogInsightsDependencies) => async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const admin = deps.getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(authHeader.slice(7));
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session.' }); return; }
  const { data: profile } = await admin.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (auth.user.app_metadata?.role !== 'admin' && profile?.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return; }

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

// Generous enough for genuine iterative use (draft, revise, re-analyze) while
// bounding cost from a runaway client bug or a compromised admin session --
// each call is a real, billed Gemini request.
const isAllowedByInsightsRateLimit = createFixedWindowLimiter(10 * 60_000, 20);

const router = Router();
router.post('/topic-insights', (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  if (!isAllowedByInsightsRateLimit(key)) { res.status(429).json({ error: 'Too many analysis requests. Please wait a few minutes and try again.' }); return; }
  next();
}, createTopicInsightsHandler(dependencies));

export default router;

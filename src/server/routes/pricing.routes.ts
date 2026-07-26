import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { resolveServerPricingContext } from '../services/pricing.service.js';

const router = Router();
async function optionalUser(req: Request) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  return error ? null : data.user;
}
router.get('/context', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(resolveServerPricingContext(req, await optionalUser(req)));
});
export default router;

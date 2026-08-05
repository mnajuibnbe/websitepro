import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { resolveServerPricingContext, amountToMinorUnits } from '../services/pricing.service.js';

interface CheckoutDependencies {
  getSupabaseAdmin: typeof getSupabaseAdmin;
  resolveServerPricingContext: typeof resolveServerPricingContext;
  amountToMinorUnits: typeof amountToMinorUnits;
}

const dependencies: CheckoutDependencies = { getSupabaseAdmin, resolveServerPricingContext, amountToMinorUnits };

export const createCheckoutHandler = (deps: CheckoutDependencies) => async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  const admin = deps.getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) { res.status(401).json({ error: 'Invalid session' }); return; }
  const courseId = req.body?.courseId;
  if (typeof courseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(courseId)) { res.status(400).json({ error: 'Invalid course ID' }); return; }

  const context = deps.resolveServerPricingContext(req, auth.user);
  const { data: course, error } = await admin.from('courses').select('id,title,status,price_egp,price_usd').eq('id', courseId).eq('status', 'published').single();
  if (error || !course) { res.status(404).json({ error: 'Published course not found' }); return; }
  const rawAmount = context.currency === 'EGP' ? course.price_egp : course.price_usd;
  if (rawAmount === null || rawAmount === undefined) { res.status(409).json({ error: `${context.currency} price is unavailable. Contact support.` }); return; }
  const amount = String(rawAmount);
  try { deps.amountToMinorUnits(amount); } catch { res.status(500).json({ error: 'Course price configuration is invalid' }); return; }

  // Single atomic write: creates the order and its linked enrollment together,
  // or creates neither. See migration checkout_create_order.
  const { data: order, error: checkoutError } = await admin.rpc('checkout_create_order', {
    p_course_id: course.id,
    p_user_id: auth.user.id,
    p_amount: amount,
    p_currency: context.currency,
    p_pricing_region: context.countryGroup,
    p_pricing_source: context.source,
  });
  if (checkoutError) {
    if (checkoutError.code === '23505') { res.status(409).json({ error: checkoutError.message }); return; }
    if (checkoutError.code === 'P0002') { res.status(404).json({ error: checkoutError.message }); return; }
    res.status(500).json({ error: 'Could not create order' });
    return;
  }
  res.status(201).json({ order });
};

const router = Router();
router.post('/', createCheckoutHandler(dependencies));
export default router;

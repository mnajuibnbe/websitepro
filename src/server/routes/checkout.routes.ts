import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { resolveServerPricingContext, amountToMinorUnits } from '../services/pricing.service.js';

const router = Router();
router.post('/', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const admin = getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return res.status(401).json({ error: 'Invalid session' });
  const courseId = req.body?.courseId;
  if (typeof courseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(courseId)) return res.status(400).json({ error: 'Invalid course ID' });

  const context = resolveServerPricingContext(req, auth.user);
  const { data: course, error } = await admin.from('courses').select('id,title,status,price_egp,price_usd').eq('id', courseId).eq('status', 'published').single();
  if (error || !course) return res.status(404).json({ error: 'Published course not found' });
  const rawAmount = context.currency === 'EGP' ? course.price_egp : course.price_usd;
  if (rawAmount === null || rawAmount === undefined) return res.status(409).json({ error: `${context.currency} price is unavailable. Contact support.` });
  const amount = String(rawAmount);
  try { amountToMinorUnits(amount); } catch { return res.status(500).json({ error: 'Course price configuration is invalid' }); }

  // Ignore all client amount/currency fields. The immutable snapshot is selected above.
  const { data: order, error: orderError } = await admin.from('course_orders').insert({
    course_id: course.id, user_id: auth.user.id, amount, currency: context.currency,
    pricing_region: context.countryGroup, pricing_source: context.source,
    payment_status: Number(amount) === 0 ? 'paid' : 'pending', enrollment_status: 'pending',
  }).select('*').single();
  if (orderError) return res.status(500).json({ error: 'Could not create order' });

  const { error: enrollmentError } = await admin.from('enrollments').upsert({ user_id: auth.user.id, course_id: course.id, status: Number(amount) === 0 ? 'active' : 'pending' }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  if (enrollmentError) return res.status(500).json({ error: 'Order created but enrollment request failed', orderId: order.id });
  return res.status(201).json({ order });
});
export default router;

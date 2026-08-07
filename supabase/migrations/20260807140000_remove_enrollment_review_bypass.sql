-- Phase B-11 follow-up: close the direct-approval bypass around payment
-- review. Before this migration, an admin could flip any pending
-- enrollment to active (and the linked order's enrollment_status to match)
-- via a plain client-side UPDATE, without ever looking at a payment proof.
--
-- That path is now provably dead weight rather than a legitimate shortcut:
-- checkout_create_order() only ever leaves an enrollment 'pending' when the
-- order amount is > 0 (a free course activates immediately at creation),
-- and the catalog has no course priced at 0. So every 'pending' enrollment
-- today is a paid order awaiting proof review, which admin_review_payment_
-- submission() now owns atomically. A grep of the codebase confirms these
-- two policies were used by nothing except AdminDashboard.tsx's removed
-- "Enrollment requests" table — no SECURITY DEFINER function needs them,
-- since those already bypass RLS as their owner.
BEGIN;

DROP POLICY IF EXISTS "enrollments_update_admin" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can update course order status" ON public.course_orders;

NOTIFY pgrst, 'reload schema';
COMMIT;

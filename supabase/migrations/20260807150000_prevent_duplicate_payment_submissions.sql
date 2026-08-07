-- Closes two related gaps in payment_submissions found during adversarial
-- testing of the B-10/B-11 payment-proof flow:
--
-- 1. The INSERT policy from 20260801000000 only checked that the caller
--    owns the order and that the new row is 'pending' — it never checked
--    the order's own payment state. A student could file unlimited new
--    'pending' submissions against an order that admin_review_payment_submission
--    had already approved (course_orders.payment_status = 'paid'), and each
--    one would surface in admin_list_pending_payment_submissions()
--    indistinguishable from a genuine new purchase.
-- 2. There was no uniqueness constraint on payment_submissions.order_id, so
--    even for a still-unpaid order a student could file multiple concurrent
--    'pending' submissions (admin-queue spam / TOCTOU race between the
--    policy check and the insert).
--
-- Fixed with both a policy check and a partial unique index, since each
-- closes a different half of the gap: the policy check blocks resubmission
-- once an order is already paid, and the unique index blocks duplicate
-- concurrent pending rows for an order that is still legitimately
-- unpaid — a WITH CHECK clause alone is not atomic across concurrent
-- transactions targeting the same order. Rejected submissions leave no
-- 'pending' row behind (payment_submissions_review_state_check requires
-- reviewed_by/reviewed_at once status != 'pending'), so a genuinely
-- rejected student can still resubmit.
BEGIN;

CREATE UNIQUE INDEX payment_submissions_order_pending_unique
  ON public.payment_submissions(order_id)
  WHERE status = 'pending';

DROP POLICY "Students can submit payment proof for own orders" ON public.payment_submissions;
CREATE POLICY "Students can submit payment proof for own orders"
  ON public.payment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.course_orders AS o
      WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())
        AND o.payment_status = 'pending'
    )
  );

COMMIT;

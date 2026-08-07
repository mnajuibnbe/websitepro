-- Phase B-11: admin review of payment proof submissions.
--
-- Adds the rejection reason column payment_submissions was missing, extends
-- admin_audit_logs to accept payment_submission entities, and introduces the
-- single atomic entry point admins must use to decide a submission —
-- modeled on public.admin_set_enrollment_access (row-lock + reason
-- validation + audit trail) and public.admin_review_instructor_application
-- (approve/reject with reviewer + timestamp on the same row).
BEGIN;

ALTER TABLE public.payment_submissions
  ADD COLUMN rejection_reason TEXT NULL;

-- Mirrors payment_submissions_review_state_check: a reason must exist
-- exactly when (and only when) the submission was rejected.
ALTER TABLE public.payment_submissions
  ADD CONSTRAINT payment_submissions_rejection_reason_check
  CHECK (
    (status = 'rejected' AND rejection_reason IS NOT NULL AND char_length(trim(rejection_reason)) BETWEEN 3 AND 1000)
    OR (status <> 'rejected' AND rejection_reason IS NULL)
  );

ALTER TABLE public.admin_audit_logs
  DROP CONSTRAINT admin_audit_logs_entity_type_check;
ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_entity_type_check
  CHECK (entity_type = ANY (ARRAY['course'::text, 'course_section'::text, 'lesson'::text, 'curriculum_item'::text, 'payment_submission'::text]));

-- The only sanctioned way to change a submission's status is now
-- admin_review_payment_submission(), which updates payment_submissions,
-- course_orders, and enrollments together in one transaction. A direct
-- client-side UPDATE (the old "Admins can review payment submissions"
-- policy) could flip status to approved without ever touching the order or
-- enrollment, defeating that atomicity guarantee — so it is removed.
DROP POLICY IF EXISTS "Admins can review payment submissions" ON public.payment_submissions;

CREATE OR REPLACE FUNCTION public.admin_list_pending_payment_submissions()
RETURNS TABLE (
  submission_id UUID,
  order_id UUID,
  method TEXT,
  reference_note TEXT,
  proof_image_url TEXT,
  submitted_at TIMESTAMPTZ,
  student_name TEXT,
  student_email TEXT,
  course_title TEXT,
  amount NUMERIC,
  currency TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.id, ps.order_id, ps.method, ps.reference_note, ps.proof_image_url, ps.submitted_at,
    COALESCE(u.full_name, 'Unnamed student'), COALESCE(u.email, ''),
    COALESCE(c.title, 'Untitled course'), co.amount, co.currency
  FROM public.payment_submissions ps
  JOIN public.course_orders co ON co.id = ps.order_id
  JOIN public.users u ON u.id = co.user_id
  JOIN public.courses c ON c.id = co.course_id
  WHERE public.is_admin() AND ps.status = 'pending'
  ORDER BY ps.submitted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_pending_payment_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_payment_submissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_payment_submission(
  p_submission_id UUID,
  p_decision TEXT,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission public.payment_submissions;
  v_order public.course_orders;
  v_reason TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Decision must be approved or rejected';
  END IF;

  v_reason := NULLIF(trim(COALESCE(p_rejection_reason, '')), '');
  IF p_decision = 'rejected' AND (v_reason IS NULL OR char_length(v_reason) < 3) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'A rejection reason of at least 3 characters is required';
  END IF;

  -- Row lock: a concurrent second reviewer blocks here until this
  -- transaction commits, then sees status <> 'pending' and is rejected
  -- below instead of double-applying the decision.
  SELECT * INTO v_submission FROM public.payment_submissions WHERE id = p_submission_id FOR UPDATE;
  IF v_submission.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Payment submission not found';
  END IF;
  IF v_submission.status <> 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'This submission was already reviewed';
  END IF;

  SELECT * INTO v_order FROM public.course_orders WHERE id = v_submission.order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Order not found for this submission';
  END IF;

  IF p_decision = 'approved' THEN
    IF v_order.enrollment_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Order has no linked enrollment to activate';
    END IF;

    UPDATE public.payment_submissions
      SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = NULL
      WHERE id = v_submission.id;

    UPDATE public.course_orders
      SET payment_status = 'paid', enrollment_status = 'active', updated_at = now()
      WHERE id = v_order.id;

    UPDATE public.enrollments SET status = 'active' WHERE id = v_order.enrollment_id;
  ELSE
    UPDATE public.payment_submissions
      SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = v_reason
      WHERE id = v_submission.id;
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), p_decision, 'payment_submission', v_submission.id,
    jsonb_build_object('order_id', v_order.id, 'rejection_reason', v_reason)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_payment_submission(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_payment_submission(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

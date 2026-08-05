-- Make checkout order + enrollment creation one atomic operation, and link
-- course_orders back to the enrollment it created so a later payment
-- approval can find the row to activate.
BEGIN;

ALTER TABLE public.course_orders
  ADD COLUMN enrollment_id UUID NULL REFERENCES public.enrollments(id) ON DELETE SET NULL;

CREATE INDEX idx_course_orders_enrollment_id
  ON public.course_orders(enrollment_id)
  WHERE enrollment_id IS NOT NULL;

-- Callable only by the trusted Express checkout route via the service-role
-- client, after it has already authenticated the caller and resolved the
-- server-side amount/currency snapshot. A service-role connection carries no
-- JWT, so auth.uid() is unavailable here; identity is taken as a parameter
-- instead, and EXECUTE is granted to service_role only (not authenticated)
-- to preserve that trust boundary.
CREATE OR REPLACE FUNCTION public.checkout_create_order(
  p_course_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_pricing_region TEXT,
  p_pricing_source TEXT
) RETURNS public.course_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_course public.courses;
  v_enrollment public.enrollments;
  v_enrollment_status TEXT;
  v_order public.course_orders;
BEGIN
  IF p_course_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Course and user are required';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id AND status = 'published' FOR UPDATE;
  IF v_course.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Published course not found';
  END IF;

  SELECT * INTO v_enrollment FROM public.enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id
    FOR UPDATE;

  IF v_enrollment.id IS NOT NULL AND v_enrollment.status <> 'cancelled' THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = CASE
      WHEN v_enrollment.status = 'active' THEN 'You are already enrolled in this course.'
      ELSE 'Your enrollment request is already pending.'
    END;
  END IF;

  v_enrollment_status := CASE WHEN p_amount = 0 THEN 'active' ELSE 'pending' END;

  IF v_enrollment.id IS NOT NULL THEN
    UPDATE public.enrollments SET status = v_enrollment_status
      WHERE id = v_enrollment.id
      RETURNING * INTO v_enrollment;
  ELSE
    INSERT INTO public.enrollments (user_id, course_id, status)
      VALUES (p_user_id, p_course_id, v_enrollment_status)
      RETURNING * INTO v_enrollment;
  END IF;

  INSERT INTO public.course_orders (
    course_id, user_id, amount, currency, pricing_region, pricing_source,
    payment_status, enrollment_status, enrollment_id
  ) VALUES (
    p_course_id, p_user_id, p_amount, p_currency, p_pricing_region, p_pricing_source,
    CASE WHEN p_amount = 0 THEN 'paid' ELSE 'pending' END, v_enrollment_status, v_enrollment.id
  ) RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.checkout_create_order(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_create_order(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.checkout_create_order(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) IS
  'Atomically creates a course order and its linked enrollment, re-validating course publication and existing-enrollment state in one transaction. Callable only by service_role from the trusted checkout server route.';

NOTIFY pgrst, 'reload schema';
COMMIT;

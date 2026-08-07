-- Targeted verification for 20260807150000_prevent_duplicate_payment_submissions.
-- Run in a disposable/Preview project only (never against production).
-- Uses disposable fixtures wrapped in BEGIN/ROLLBACK so nothing persists.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'payment_submissions'
      AND indexname = 'payment_submissions_order_pending_unique'
  ) THEN
    RAISE EXCEPTION 'Missing payment_submissions_order_pending_unique index';
  END IF;
END $$;

DO $$
DECLARE
  v_student UUID := gen_random_uuid();
  v_course_paid UUID;
  v_course_pending UUID;
  v_order_paid UUID;
  v_order_pending UUID;
BEGIN
  -- Fixtures: one auth user, two minimal courses, two orders (one already
  -- paid/approved, one still pending), owned by the same student.
  -- auth.users' handle_new_user trigger creates the matching public.users row.
  INSERT INTO auth.users (id, email) VALUES (v_student, 'duplicate-fixture@example.test');

  INSERT INTO public.courses (title, slug) VALUES ('Fixture Course Paid', 'fixture-course-paid-dup-test')
    RETURNING id INTO v_course_paid;
  INSERT INTO public.courses (title, slug) VALUES ('Fixture Course Pending', 'fixture-course-pending-dup-test')
    RETURNING id INTO v_course_pending;

  INSERT INTO public.course_orders (course_id, user_id, amount, currency, pricing_region, pricing_source, payment_status, enrollment_status)
    VALUES (v_course_paid, v_student, 100, 'EGP', 'egypt', 'default', 'paid', 'active')
    RETURNING id INTO v_order_paid;
  INSERT INTO public.course_orders (course_id, user_id, amount, currency, pricing_region, pricing_source, payment_status, enrollment_status)
    VALUES (v_course_pending, v_student, 100, 'EGP', 'egypt', 'default', 'pending', 'pending')
    RETURNING id INTO v_order_pending;

  -- Simulate the student's own authenticated session for the RLS checks below.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Case 1: order already paid/approved — new pending submission must be rejected.
  BEGIN
    INSERT INTO public.payment_submissions (order_id, method, proof_image_url)
      VALUES (v_order_paid, 'bank_transfer', 'https://example.test/proof-1.png');
    RAISE EXCEPTION 'REGRESSION: submission against an already-paid order was allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'OK: submission against an already-paid order correctly blocked by RLS';
  END;

  -- Case 2: order still pending — first submission succeeds.
  INSERT INTO public.payment_submissions (order_id, method, proof_image_url)
    VALUES (v_order_pending, 'bank_transfer', 'https://example.test/proof-2.png');

  -- Case 3: same still-pending order — a second concurrent pending submission
  -- must be rejected by the partial unique index, not silently accepted.
  BEGIN
    INSERT INTO public.payment_submissions (order_id, method, proof_image_url)
      VALUES (v_order_pending, 'instapay', 'https://example.test/proof-3.png');
    RAISE EXCEPTION 'REGRESSION: a second pending submission for the same order was allowed';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'OK: duplicate pending submission for the same order correctly blocked by unique index';
  END;

  RESET ROLE;
  RAISE NOTICE 'All duplicate-submission checks passed';
END $$;

ROLLBACK;

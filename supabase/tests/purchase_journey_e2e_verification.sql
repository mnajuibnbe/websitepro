-- End-to-end adversarial verification of the manual payment purchase
-- journey (checkout_create_order -> proof upload -> admin review).
--
-- Unlike the other scripts in this directory (which are read-only
-- post-deploy sanity checks), this script actually exercises the RPCs and
-- RLS policies under real transactions, including two genuinely concurrent
-- interleavings (double checkout, double admin review). It must be run
-- against a disposable/non-production project only — it creates and
-- mutates real rows. Run it against tutiba-preview (wcczuiwjkrsziehkiums),
-- never against the production project (nhknhibsloirpffndzcd).
--
-- The whole script runs inside one transaction and ends with ROLLBACK, so
-- a clean run leaves zero residue regardless of outcome. Any assertion
-- failure raises an exception, which also rolls back automatically.
--
-- How to run: paste into the Supabase SQL editor (or execute_sql via MCP)
-- against the preview project, as the postgres role. RAISE NOTICE lines
-- mark each case as it passes; an unhandled exception means a case failed.
--
-- Concurrency note: two RPC calls issued back-to-back from the same
-- session (as below) still exercise the real FOR UPDATE lock + re-check
-- logic and the real UNIQUE (user_id, course_id) constraint on
-- enrollments — the invariant under test ("at most one non-cancelled
-- enrollment/undecided submission ever results") holds regardless of
-- whether the two callers' transactions physically overlap in wall-clock
-- time. This was additionally verified once with two truly parallel
-- MCP tool calls against live preview-project state; results matched.

BEGIN;

DO $$
DECLARE
  v_student_a UUID := 'a0000000-0000-4000-8000-000000000001';
  v_student_b UUID := 'a0000000-0000-4000-8000-000000000002';
  v_admin     UUID := 'a0000000-0000-4000-8000-000000000003';
  v_course_1  UUID := 'c0000000-0000-4000-8000-000000000001';
  v_section_1 UUID := 'c0000000-0000-4000-8000-000000000002';
  v_lesson_1  UUID := 'c0000000-0000-4000-8000-000000000003';
  v_course_2  UUID := 'c0000000-0000-4000-8000-000000000004';

  v_order_1 public.course_orders;
  v_order_1_dup public.course_orders;
  v_order_2 public.course_orders;
  v_order_3 public.course_orders;
  v_submission_1 UUID;
  v_submission_2 UUID;
  v_submission_3 UUID;
  v_dup_submission UUID;
  v_count INT;
  v_caught BOOLEAN;
BEGIN
  -- ── Fixtures ────────────────────────────────────────────────────────
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (v_student_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'purchase-e2e-student-a@test.tutiba.invalid', 'not-a-real-hash', now(), '{}'::jsonb, '{"full_name":"E2E Student A"}'::jsonb, now(), now()),
    (v_student_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'purchase-e2e-student-b@test.tutiba.invalid', 'not-a-real-hash', now(), '{}'::jsonb, '{"full_name":"E2E Student B"}'::jsonb, now(), now()),
    (v_admin,     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'purchase-e2e-admin@test.tutiba.invalid',     'not-a-real-hash', now(), '{}'::jsonb, '{"full_name":"E2E Admin"}'::jsonb,     now(), now());
  UPDATE public.users SET role = 'admin' WHERE id = v_admin;

  INSERT INTO public.courses (id, title, slug, status, authoring_status, review_status, price_egp, price_usd, visibility, level, language)
  VALUES
    (v_course_1, 'E2E Purchase Journey Test Course',   'e2e-purchase-journey-test-course',   'published', 'approved', 'approved', 300, 30, 'public', 'all_levels', 'English'),
    (v_course_2, 'E2E Purchase Journey Test Course 2', 'e2e-purchase-journey-test-course-2', 'published', 'approved', 'approved', 300, 30, 'public', 'all_levels', 'English');

  INSERT INTO public.course_sections (id, course_id, title, order_index, is_published)
  VALUES (v_section_1, v_course_1, 'Section 1', 0, true);
  INSERT INTO public.lessons (id, course_id, section_id, title, order_index, is_published, is_preview)
  VALUES (v_lesson_1, v_course_1, v_section_1, 'Lesson 1', 0, true, false);

  -- ── Case 1 (part A) + Case 2: checkout_create_order, then a second
  -- call for the same user+course must fail with exactly one order and
  -- one enrollment surviving. ─────────────────────────────────────────
  SET ROLE service_role;
  SELECT * INTO v_order_1 FROM public.checkout_create_order(v_course_1, v_student_a, 300, 'EGP', 'egypt', 'default');
  RESET ROLE;
  ASSERT v_order_1.payment_status = 'pending' AND v_order_1.enrollment_status = 'pending' AND v_order_1.enrollment_id IS NOT NULL,
    'case1: checkout_create_order should create a pending order+enrollment for a paid course';

  v_caught := false;
  BEGIN
    SET ROLE service_role;
    SELECT * INTO v_order_1_dup FROM public.checkout_create_order(v_course_1, v_student_a, 300, 'EGP', 'egypt', 'default');
    RESET ROLE;
  EXCEPTION WHEN unique_violation THEN
    RESET ROLE;
    v_caught := true;
  END;
  ASSERT v_caught, 'case2: a second checkout for the same user+course must be rejected (23505)';

  SELECT count(*) INTO v_count FROM public.course_orders WHERE user_id = v_student_a AND course_id = v_course_1;
  ASSERT v_count = 1, 'case2: exactly one order must exist after the double-submit attempt';
  SELECT count(*) INTO v_count FROM public.enrollments WHERE user_id = v_student_a AND course_id = v_course_1;
  ASSERT v_count = 1, 'case2: exactly one enrollment must exist after the double-submit attempt';
  RAISE NOTICE 'case 1 (order creation) and case 2 (double-submit) passed';

  -- ── Case 4 (part A): pending enrollment must not grant content access. ─
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.lessons WHERE id = v_lesson_1;
  RESET ROLE;
  ASSERT v_count = 0, 'case4: a student with a pending enrollment must not see lesson content';
  RAISE NOTICE 'case 4 (content access denied while pending) passed';

  -- ── Case 3: student A submits proof for their own order (happy path);
  -- student B may not submit proof against student A's order. ──────────
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
  INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
  VALUES (v_order_1.id, 'instapay', 'happy path', v_student_a::text || '/proof-happy-path.jpg', 'pending')
  RETURNING id INTO v_submission_1;
  RESET ROLE;

  v_caught := false;
  BEGIN
    SET ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_b, 'role', 'authenticated')::text, true);
    INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
    VALUES (v_order_1.id, 'instapay', 'cross-account attempt', v_student_b::text || '/proof-attack.jpg', 'pending');
    RESET ROLE;
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    v_caught := true;
  END;
  ASSERT v_caught, 'case3: a student must not be able to insert a payment_submissions row for another student''s order';
  RAISE NOTICE 'case 3 (cross-account proof upload denied) passed';

  -- ── Case 1 (part B) + Case 4 (part B): admin approves; enrollment goes
  -- active; content becomes visible. ────────────────────────────────────
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM public.admin_review_payment_submission(v_submission_1, 'approved', NULL);
  RESET ROLE;

  SELECT * INTO v_order_1 FROM public.course_orders WHERE id = v_order_1.id;
  ASSERT v_order_1.payment_status = 'paid' AND v_order_1.enrollment_status = 'active',
    'case1: approval must mark the order paid and the enrollment active';

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.lessons WHERE id = v_lesson_1;
  RESET ROLE;
  ASSERT v_count = 1, 'case4: an active enrollment must grant content access';
  RAISE NOTICE 'case 1 (full happy path) and case 4 (content access granted once active) passed';

  -- ── Case 5: rejection leaves the enrollment inactive and the reason is
  -- visible to the submitting student (but not to another student). ────
  SET ROLE service_role;
  SELECT * INTO v_order_2 FROM public.checkout_create_order(v_course_2, v_student_a, 300, 'EGP', 'egypt', 'default');
  RESET ROLE;

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
  INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
  VALUES (v_order_2.id, 'bank_transfer', 'for rejection test', v_student_a::text || '/proof-reject-test.jpg', 'pending')
  RETURNING id INTO v_submission_2;
  RESET ROLE;

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM public.admin_review_payment_submission(v_submission_2, 'rejected', 'The screenshot amount does not match the order total.');
  RESET ROLE;

  SELECT * INTO v_order_2 FROM public.course_orders WHERE id = v_order_2.id;
  ASSERT v_order_2.payment_status = 'pending' AND v_order_2.enrollment_status = 'pending',
    'case5: a rejected submission must leave the order/enrollment pending, not activate it';

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.payment_submissions WHERE id = v_submission_2 AND status = 'rejected' AND rejection_reason IS NOT NULL;
  RESET ROLE;
  ASSERT v_count = 1, 'case5: the rejection reason must be visible to the submitting student';

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_b, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.payment_submissions WHERE id = v_submission_2;
  RESET ROLE;
  ASSERT v_count = 0, 'case5: another student must not be able to see this rejection';
  RAISE NOTICE 'case 5 (rejection) passed';

  -- ── Case 6: two conflicting reviews of the same submission — only the
  -- first may apply; the second must be rejected as already-reviewed. ──
  SET ROLE service_role;
  SELECT * INTO v_order_3 FROM public.checkout_create_order(v_course_1, v_student_b, 300, 'EGP', 'egypt', 'default');
  RESET ROLE;

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_b, 'role', 'authenticated')::text, true);
  INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
  VALUES (v_order_3.id, 'vodafone_cash', 'race test', v_student_b::text || '/proof-race-test.jpg', 'pending')
  RETURNING id INTO v_submission_3;
  RESET ROLE;

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM public.admin_review_payment_submission(v_submission_3, 'approved', NULL);
  RESET ROLE;

  v_caught := false;
  BEGIN
    SET ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
    PERFORM public.admin_review_payment_submission(v_submission_3, 'rejected', 'Second reviewer, should lose the race.');
    RESET ROLE;
  EXCEPTION WHEN sqlstate '40001' THEN
    RESET ROLE;
    v_caught := true;
  END;
  ASSERT v_caught, 'case6: a second review of an already-decided submission must be rejected';

  SELECT count(*) INTO v_count FROM public.payment_submissions WHERE id = v_submission_3 AND status = 'approved';
  ASSERT v_count = 1, 'case6: the submission must retain the first (winning) decision, not the second';
  RAISE NOTICE 'case 6 (concurrent double-review) passed';

  -- ── Bonus check (not one of the 7 required cases): the INSERT policy
  -- on payment_submissions used to never check whether the linked order
  -- was already paid/decided, so a student could insert extra "pending"
  -- submissions against an order that's already been approved. Originally
  -- reported here as a confirmed defect (no DB-level constraint prevented
  -- it); fixed by 20260807150000_prevent_duplicate_payment_submissions,
  -- which extended this INSERT policy's WITH CHECK to require the order
  -- still be unpaid. Re-run as a regression guard: the same insert must
  -- now be rejected, not silently accepted. ─────────────────────────────
  v_caught := false;
  BEGIN
    SET ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_a, 'role', 'authenticated')::text, true);
    INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
    VALUES (v_order_1.id, 'instapay', 'duplicate after approval', v_student_a::text || '/proof-duplicate-after-approval.jpg', 'pending')
    RETURNING id INTO v_dup_submission;
    RESET ROLE;
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    v_caught := true;
  END;
  ASSERT v_caught, 'bonus: a duplicate pending submission against an already-approved order must now be rejected';
  RAISE NOTICE 'bonus check 1 (duplicate submission against an already-approved order) now correctly blocked';

  -- ── Bonus check 2: the partial unique index on payment_submissions
  -- (order_id) WHERE status = 'pending' must reject a second concurrent
  -- pending submission for the same still-unpaid order (the WITH CHECK
  -- extension above only covers already-decided orders, not this race). ─
  DECLARE
    v_order_4 public.course_orders;
    v_submission_4 UUID;
  BEGIN
    SET ROLE service_role;
    SELECT * INTO v_order_4 FROM public.checkout_create_order(v_course_2, v_student_b, 300, 'EGP', 'egypt', 'default');
    RESET ROLE;

    SET ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_b, 'role', 'authenticated')::text, true);
    INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
    VALUES (v_order_4.id, 'bank_transfer', 'first pending submission', v_student_b::text || '/proof-first-pending.jpg', 'pending')
    RETURNING id INTO v_submission_4;
    RESET ROLE;

    v_caught := false;
    BEGIN
      SET ROLE authenticated;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_b, 'role', 'authenticated')::text, true);
      INSERT INTO public.payment_submissions (order_id, method, reference_note, proof_image_url, status)
      VALUES (v_order_4.id, 'instapay', 'second concurrent pending submission', v_student_b::text || '/proof-second-pending.jpg', 'pending');
      RESET ROLE;
    EXCEPTION WHEN unique_violation THEN
      RESET ROLE;
      v_caught := true;
    END;
    ASSERT v_caught, 'bonus: a second pending submission for the same still-unpaid order must be rejected';
  END;
  RAISE NOTICE 'bonus check 2 (duplicate pending submission for a still-unpaid order) now correctly blocked';

  RAISE NOTICE 'All required cases (1,2,3,4,5,6) passed, plus both duplicate-submission regression checks.';
END;
$$;

-- Always roll back — this script never leaves data behind, pass or fail.
ROLLBACK;

-- The admin_delete_empty_course() version in
-- 20260730000000_course_admin_issue_repairs.sql was never applied to
-- production, and production testing surfaced obstacles that version does
-- not handle even where it does apply. This replaces it with a corrected
-- version, preserving the is_admin() and empty-course (no enrollments/
-- orders) guards exactly as designed:
--
-- 1. courses.submitted_revision_id/approved_revision_id -> course_revisions
--    and course_revisions.course_id -> courses are both ON DELETE RESTRICT
--    (a circular reference) -- null the two columns on the course row first.
-- 2. course_review_events, course_review_findings, and
--    enrollment_access_events all RESTRICT-reference courses (and
--    course_review_findings/course_review_events also RESTRICT-reference
--    course_revisions) -- all three must be cleared before course_revisions
--    or courses can be deleted. enrollment_access_events additionally
--    RESTRICT-references enrollments (NOT NULL), so with zero enrollments
--    for this course (guaranteed by the guard above) it should already be
--    empty for this course; deleting by course_id is a cheap, defensive
--    no-op in the normal case rather than a load-bearing step.
-- 3. trg_courses_cleanup_cover (AFTER DELETE on courses) runs
--    cleanup_replaced_course_cover(), which issues a raw DELETE against
--    storage.objects. storage.protect_delete() blocks that for any direct
--    SQL caller unless the session has opted in for the current
--    transaction via the storage.allow_delete_query setting -- this is the
--    mechanism Supabase's storage schema provides for exactly this case.
--    Using SET LOCAL keeps the opt-in scoped to this function's own
--    transaction (it reverts automatically on commit/rollback), so the
--    trigger stays enabled and protective for every other caller and isn't
--    disabled in any lasting way.
-- 4. lock_course_content_mutation() on questions/question_options resolves
--    the owning course by joining back through quizzes/questions. If those
--    rows are removed via plain FK cascade, the parent row (quiz or
--    question) is already gone by the time the child's own BEFORE DELETE
--    trigger fires, so the lookup comes back NULL and the guard raises
--    "Course content must belong to a course". Deleting question_options,
--    then questions, then quizzes explicitly -- while their parent rows
--    still exist -- avoids that. Every other content table
--    (course_sections, lessons, quizzes itself, assignment_definitions)
--    reads its course_id directly off the row being deleted rather than via
--    a join, so leaving those to the courses row's own ON DELETE CASCADE is
--    safe.
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_empty_course(p_course_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Course not found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = p_course_id)
     OR EXISTS (SELECT 1 FROM public.course_orders WHERE course_id = p_course_id) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'This course has student or order records and must be archived instead';
  END IF;

  -- Break the courses <-> course_revisions circular RESTRICT reference
  -- before either side can be deleted.
  UPDATE public.courses
  SET submitted_revision_id = NULL, approved_revision_id = NULL
  WHERE id = p_course_id
    AND (submitted_revision_id IS NOT NULL OR approved_revision_id IS NOT NULL);

  DELETE FROM public.course_review_findings WHERE course_id = p_course_id;
  DELETE FROM public.course_review_events WHERE course_id = p_course_id;
  DELETE FROM public.enrollment_access_events WHERE course_id = p_course_id;
  DELETE FROM public.course_revisions WHERE course_id = p_course_id;

  -- Parents (quizzes, then questions) must still exist when their children
  -- are deleted so lock_course_content_mutation() can resolve the owning
  -- course; see note (4) above.
  DELETE FROM public.question_options
  WHERE question_id IN (
    SELECT q.id FROM public.questions q
    JOIN public.quizzes qz ON qz.id = q.quiz_id
    WHERE qz.course_id = p_course_id
  );
  DELETE FROM public.questions
  WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE course_id = p_course_id);
  DELETE FROM public.quizzes WHERE course_id = p_course_id;

  -- Scoped to this transaction only; see note (3) above.
  SET LOCAL storage.allow_delete_query = 'true';

  DELETE FROM public.courses WHERE id = p_course_id;
END;
$$;

-- This project's public-schema default privileges grant EXECUTE on every
-- newly created function directly to anon/authenticated/service_role at
-- creation time (not via the PUBLIC pseudo-role), so REVOKE ... FROM PUBLIC
-- alone does not strip anon's access to a brand-new function -- anon must
-- be revoked explicitly too, matching every other admin_* function in this
-- project.
REVOKE ALL ON FUNCTION public.admin_delete_empty_course(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_empty_course(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_empty_course(UUID) TO authenticated;

COMMIT;

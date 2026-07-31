-- Reviewer assignment metadata changes after submission and is not course
-- content. Excluding it prevents claiming a review from invalidating the
-- immutable content revision that is about to be approved.

CREATE OR REPLACE FUNCTION public.course_snapshot(p_course_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT JSONB_BUILD_OBJECT(
    'course', TO_JSONB(c) - ARRAY[
      'authoring_status','review_status','status','version',
      'submitted_revision_id','approved_revision_id',
      'review_assignee_id','review_claimed_at','review_due_at',
      'created_at','updated_at','published_at','archived_at'
    ],
    'sections', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(s) - ARRAY['created_at','updated_at'] ORDER BY s.order_index, s.id)
      FROM public.course_sections s
      WHERE s.course_id = c.id AND s.deleted_at IS NULL
    ), '[]'::JSONB),
    'lessons', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(l) - ARRAY['version','created_at','updated_at','video_metadata_updated_at'] ORDER BY l.section_id, l.order_index, l.id)
      FROM public.lessons l
      WHERE l.course_id = c.id AND l.deleted_at IS NULL
    ), '[]'::JSONB),
    'quizzes', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(q) - ARRAY['created_at','updated_at'] ORDER BY q.lesson_id, q.id)
      FROM public.quizzes q
      WHERE q.course_id = c.id
    ), '[]'::JSONB),
    'questions', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(qn) - ARRAY['created_at','updated_at'] ORDER BY qn.quiz_id, qn.order_index, qn.id)
      FROM public.questions qn
      JOIN public.quizzes q ON q.id = qn.quiz_id
      WHERE q.course_id = c.id
    ), '[]'::JSONB),
    'question_options', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(o) - ARRAY['created_at','updated_at'] ORDER BY o.question_id, o.order_index, o.id)
      FROM public.question_options o
      JOIN public.questions qn ON qn.id = o.question_id
      JOIN public.quizzes q ON q.id = qn.quiz_id
      WHERE q.course_id = c.id
    ), '[]'::JSONB),
    'assignments', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(a) - ARRAY['created_at','updated_at'] ORDER BY a.lesson_id, a.id)
      FROM public.assignment_definitions a
      WHERE a.course_id = c.id
    ), '[]'::JSONB)
  )
  FROM public.courses c
  WHERE c.id = p_course_id
    AND (public.is_admin() OR c.author_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.assert_course_matches_revision(p_course_id UUID, p_revision_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expected_hash TEXT;
  v_revision_snapshot JSONB;
  v_current_snapshot JSONB;
  v_workflow_fields TEXT[] := ARRAY['review_assignee_id','review_claimed_at','review_due_at'];
BEGIN
  SELECT r.content_hash, r.snapshot
  INTO v_expected_hash, v_revision_snapshot
  FROM public.course_revisions r
  WHERE r.id = p_revision_id AND r.course_id = p_course_id;

  IF v_expected_hash IS NULL OR v_revision_snapshot IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'A valid course revision is required';
  END IF;

  IF MD5(v_revision_snapshot::TEXT) <> v_expected_hash THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Stored course revision integrity check failed';
  END IF;

  v_current_snapshot := public.course_snapshot(p_course_id);
  v_revision_snapshot := JSONB_SET(
    v_revision_snapshot,
    '{course}',
    (v_revision_snapshot -> 'course') - v_workflow_fields,
    false
  );
  v_current_snapshot := JSONB_SET(
    v_current_snapshot,
    '{course}',
    (v_current_snapshot -> 'course') - v_workflow_fields,
    false
  );

  IF v_current_snapshot IS NULL OR v_current_snapshot <> v_revision_snapshot THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Course changed after submission; return it to draft and submit a new revision';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.course_snapshot(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_course_matches_revision(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_snapshot(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

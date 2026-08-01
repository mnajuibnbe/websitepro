-- Enforce the UI promise that submitted revisions are immutable. Also allow a
-- reviewer to return a stale revision to draft; approval still requires an
-- exact content match.

CREATE OR REPLACE FUNCTION public.lock_course_content_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_course_id UUID;
  v_row_id UUID;
  v_authoring_status TEXT;
  v_workflow_fields TEXT[] := ARRAY[
    'authoring_status','review_status','status','version',
    'submitted_revision_id','approved_revision_id',
    'review_assignee_id','review_claimed_at','review_due_at',
    'created_at','updated_at','published_at','archived_at'
  ];
BEGIN
  IF TG_TABLE_NAME = 'courses' THEN
    v_course_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  ELSIF TG_TABLE_NAME IN ('course_sections','lessons','quizzes','assignment_definitions') THEN
    v_course_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.course_id ELSE NEW.course_id END;
  ELSIF TG_TABLE_NAME = 'questions' THEN
    v_row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.quiz_id ELSE NEW.quiz_id END;
    SELECT q.course_id INTO v_course_id FROM public.quizzes q WHERE q.id = v_row_id;
  ELSIF TG_TABLE_NAME = 'question_options' THEN
    v_row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.question_id ELSE NEW.question_id END;
    SELECT q.course_id INTO v_course_id
    FROM public.questions qn
    JOIN public.quizzes q ON q.id = qn.quiz_id
    WHERE qn.id = v_row_id;
  END IF;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Course content must belong to a course';
  END IF;

  PERFORM public.lock_course_workflow(v_course_id);

  IF TG_TABLE_NAME = 'courses' THEN
    IF TG_OP = 'DELETE' AND OLD.authoring_status = 'in_review' THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Course editing is locked while its submitted revision is under review';
    END IF;
    IF TG_OP = 'UPDATE'
      AND OLD.authoring_status = 'in_review'
      AND NEW.authoring_status = 'in_review'
      AND (TO_JSONB(OLD) - v_workflow_fields) IS DISTINCT FROM (TO_JSONB(NEW) - v_workflow_fields)
    THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Course editing is locked while its submitted revision is under review';
    END IF;
  ELSIF TG_OP <> 'INSERT' OR v_course_id IS NOT NULL THEN
    SELECT c.authoring_status INTO v_authoring_status
    FROM public.courses c
    WHERE c.id = v_course_id;
    IF v_authoring_status = 'in_review' THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Course editing is locked while its submitted revision is under review';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_decide_course_review(
  p_course_id UUID,
  p_decision TEXT,
  p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c public.courses%ROWTYPE;
  readiness JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  IF p_decision NOT IN ('approved','changes_requested','rejected')
    OR CHAR_LENGTH(BTRIM(COALESCE(p_notes, ''))) < 5
  THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'A valid decision and actionable review note are required';
  END IF;

  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id = p_course_id FOR UPDATE;
  IF c.authoring_status <> 'in_review' OR c.review_status <> 'submitted' OR c.submitted_revision_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'This course review is no longer actionable';
  END IF;
  IF c.review_assignee_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Claim this review before making a decision';
  END IF;

  IF p_decision = 'approved' THEN
    PERFORM public.assert_course_matches_revision(p_course_id, c.submitted_revision_id);
    IF EXISTS (
      SELECT 1 FROM public.course_review_findings f
      WHERE f.revision_id = c.submitted_revision_id AND f.status = 'open' AND f.severity = 'blocking'
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Resolve every blocking finding before approval';
    END IF;
    readiness := public.get_course_readiness(p_course_id);
    IF NOT (readiness ->> 'ready')::BOOLEAN THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Course is no longer ready for approval', DETAIL = readiness::TEXT;
    END IF;
  END IF;

  UPDATE public.courses
  SET authoring_status = CASE WHEN p_decision = 'approved' THEN 'approved' ELSE 'draft' END,
      review_status = p_decision,
      approved_revision_id = CASE WHEN p_decision = 'approved' THEN submitted_revision_id ELSE NULL END,
      status = CASE WHEN p_decision = 'approved' THEN 'published' ELSE 'draft' END,
      published_at = CASE WHEN p_decision = 'approved' THEN COALESCE(published_at, NOW()) ELSE published_at END,
      review_assignee_id = NULL,
      review_claimed_at = NULL,
      review_due_at = NULL,
      version = version + 1,
      updated_at = NOW()
  WHERE id = p_course_id;

  INSERT INTO public.course_review_events(course_id, actor_id, event_type, notes, revision_id)
  VALUES (p_course_id, auth.uid(), p_decision, BTRIM(p_notes), c.submitted_revision_id);
  IF p_decision = 'approved' THEN
    INSERT INTO public.course_review_events(course_id, actor_id, event_type, notes, revision_id)
    VALUES (p_course_id, auth.uid(), 'published', 'Published automatically after approval', c.submitted_revision_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_course_content_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_decide_course_review(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decide_course_review(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

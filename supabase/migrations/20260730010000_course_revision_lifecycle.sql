-- Phase 1: immutable review revisions and database-enforced lifecycle invariants.
BEGIN;

CREATE TABLE public.course_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  revision_number BIGINT NOT NULL,
  snapshot JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, revision_number)
);
CREATE INDEX course_revisions_course_created_idx ON public.course_revisions(course_id, created_at DESC);
ALTER TABLE public.course_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course authors view own revisions" ON public.course_revisions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.author_id = auth.uid()));
CREATE POLICY "Admins view course revisions" ON public.course_revisions FOR SELECT TO authenticated USING (public.is_admin());

ALTER TABLE public.courses
  ADD COLUMN submitted_revision_id UUID NULL REFERENCES public.course_revisions(id) ON DELETE RESTRICT,
  ADD COLUMN approved_revision_id UUID NULL REFERENCES public.course_revisions(id) ON DELETE RESTRICT;
ALTER TABLE public.course_review_events
  ADD COLUMN revision_id UUID NULL REFERENCES public.course_revisions(id) ON DELETE RESTRICT;

-- Normalize legacy rows before installing the cross-column state contract.
UPDATE public.courses SET
  authoring_status = CASE
    WHEN status = 'archived' THEN 'archived'
    WHEN status = 'published' OR review_status = 'approved' THEN 'approved'
    WHEN review_status = 'submitted' THEN 'in_review'
    ELSE 'draft'
  END,
  review_status = CASE
    WHEN status IN ('published', 'archived') OR review_status = 'approved' THEN 'approved'
    WHEN review_status = 'submitted' THEN 'submitted'
    WHEN review_status IN ('changes_requested', 'rejected') THEN review_status
    ELSE 'not_submitted'
  END;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_workflow_state_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_workflow_state_check CHECK (
  (authoring_status = 'draft' AND review_status IN ('not_submitted', 'changes_requested', 'rejected') AND status IN ('draft', 'archived')) OR
  (authoring_status = 'in_review' AND review_status = 'submitted' AND status = 'draft') OR
  (authoring_status = 'approved' AND review_status = 'approved' AND status IN ('draft', 'published', 'archived')) OR
  (authoring_status = 'archived' AND review_status = 'approved' AND status = 'archived')
);

CREATE OR REPLACE FUNCTION public.course_snapshot(p_course_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'course', to_jsonb(c) - ARRAY['authoring_status','review_status','status','version','submitted_revision_id','approved_revision_id','created_at','updated_at','published_at','archived_at'],
    'sections', COALESCE((SELECT jsonb_agg(to_jsonb(s) - ARRAY['created_at','updated_at'] ORDER BY s.order_index, s.id) FROM public.course_sections s WHERE s.course_id=c.id AND s.deleted_at IS NULL), '[]'::jsonb),
    'lessons', COALESCE((SELECT jsonb_agg(to_jsonb(l) - ARRAY['version','created_at','updated_at','video_metadata_updated_at'] ORDER BY l.section_id, l.order_index, l.id) FROM public.lessons l WHERE l.course_id=c.id AND l.deleted_at IS NULL), '[]'::jsonb),
    'quizzes', COALESCE((SELECT jsonb_agg(to_jsonb(q) - ARRAY['created_at','updated_at'] ORDER BY q.lesson_id, q.id) FROM public.quizzes q WHERE q.course_id=c.id), '[]'::jsonb),
    'questions', COALESCE((SELECT jsonb_agg(to_jsonb(qn) - ARRAY['created_at','updated_at'] ORDER BY qn.quiz_id, qn.order_index, qn.id) FROM public.questions qn JOIN public.quizzes q ON q.id=qn.quiz_id WHERE q.course_id=c.id), '[]'::jsonb),
    'question_options', COALESCE((SELECT jsonb_agg(to_jsonb(o) - ARRAY['created_at','updated_at'] ORDER BY o.question_id, o.order_index, o.id) FROM public.question_options o JOIN public.questions qn ON qn.id=o.question_id JOIN public.quizzes q ON q.id=qn.quiz_id WHERE q.course_id=c.id), '[]'::jsonb),
    'assignments', COALESCE((SELECT jsonb_agg(to_jsonb(a) - ARRAY['created_at','updated_at'] ORDER BY a.lesson_id, a.id) FROM public.assignment_definitions a WHERE a.course_id=c.id), '[]'::jsonb)
  ) FROM public.courses c WHERE c.id=p_course_id AND (public.is_admin() OR c.author_id=auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.create_course_revision(p_course_id UUID) RETURNS public.course_revisions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_snapshot JSONB; v_revision public.course_revisions; v_number BIGINT;
BEGIN
  v_snapshot := public.course_snapshot(p_course_id);
  IF v_snapshot IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Course access required'; END IF;
  SELECT COALESCE(max(revision_number), 0) + 1 INTO v_number FROM public.course_revisions WHERE course_id=p_course_id;
  INSERT INTO public.course_revisions(course_id, revision_number, snapshot, content_hash, created_by)
  VALUES(p_course_id, v_number, v_snapshot, md5(v_snapshot::text), auth.uid()) RETURNING * INTO v_revision;
  RETURN v_revision;
END $$;

CREATE OR REPLACE FUNCTION public.assert_course_matches_revision(p_course_id UUID, p_revision_id UUID) RETURNS VOID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expected TEXT; v_snapshot JSONB;
BEGIN
  SELECT content_hash INTO v_expected FROM public.course_revisions WHERE id=p_revision_id AND course_id=p_course_id;
  IF v_expected IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='A valid course revision is required'; END IF;
  v_snapshot := public.course_snapshot(p_course_id);
  IF v_snapshot IS NULL OR md5(v_snapshot::text) <> v_expected THEN
    RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Course changed after submission; return it to draft and submit a new revision';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.submit_course_for_review(p_course_id UUID,p_notes TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; readiness JSONB; revision public.course_revisions;
BEGIN
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.author_id<>auth.uid() OR NOT public.is_approved_instructor(auth.uid()) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Approved course owner required'; END IF;
  IF c.authoring_status<>'draft' OR c.review_status NOT IN('not_submitted','changes_requested','rejected') OR c.status='published' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Course cannot be submitted from its current state'; END IF;
  readiness:=public.get_course_readiness(p_course_id);
  IF NOT (readiness->>'ready')::boolean THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Complete every readiness check before submission'; END IF;
  revision:=public.create_course_revision(p_course_id);
  UPDATE public.courses SET authoring_status='in_review',review_status='submitted',submitted_revision_id=revision.id,approved_revision_id=NULL,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id) VALUES(p_course_id,auth.uid(),'submitted',nullif(trim(p_notes),''),revision.id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_course_review(p_course_id UUID,p_decision TEXT,p_notes TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  IF p_decision NOT IN('approved','changes_requested','rejected') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid review decision'; END IF;
  IF char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='A review note of at least 5 characters is required for every decision'; END IF;
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.authoring_status<>'in_review' OR c.review_status<>'submitted' OR c.submitted_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Only a submitted course revision can be reviewed'; END IF;
  PERFORM public.assert_course_matches_revision(p_course_id,c.submitted_revision_id);
  UPDATE public.courses SET authoring_status=CASE WHEN p_decision='approved' THEN 'approved' ELSE 'draft' END,review_status=p_decision,
    approved_revision_id=CASE WHEN p_decision='approved' THEN submitted_revision_id ELSE NULL END,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id) VALUES(p_course_id,auth.uid(),p_decision,trim(p_notes),c.submitted_revision_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_course_publication(p_course_id UUID,p_publish BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF p_publish THEN
    IF c.authoring_status<>'approved' OR c.review_status<>'approved' OR c.approved_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='An approved course revision is required before publication'; END IF;
    PERFORM public.assert_course_matches_revision(p_course_id,c.approved_revision_id);
  ELSIF c.status<>'published' THEN
    RETURN;
  END IF;
  UPDATE public.courses SET status=CASE WHEN p_publish THEN 'published' ELSE 'draft' END,published_at=CASE WHEN p_publish THEN COALESCE(published_at,now()) ELSE published_at END,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,revision_id) VALUES(p_course_id,auth.uid(),CASE WHEN p_publish THEN 'published' ELSE 'unpublished' END,c.approved_revision_id);
END $$;

REVOKE ALL ON FUNCTION public.course_snapshot(UUID), public.create_course_revision(UUID), public.assert_course_matches_revision(UUID,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.course_snapshot(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.submit_course_for_review(UUID,TEXT), public.admin_decide_course_review(UUID,TEXT,TEXT), public.admin_set_course_publication(UUID,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_course_for_review(UUID,TEXT), public.admin_decide_course_review(UUID,TEXT,TEXT), public.admin_set_course_publication(UUID,BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

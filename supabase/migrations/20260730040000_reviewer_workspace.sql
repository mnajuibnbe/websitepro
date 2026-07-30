-- Phase 4: reviewer assignment, structured findings, and scalable review queue.
BEGIN;

ALTER TABLE public.courses
  ADD COLUMN review_assignee_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN review_claimed_at TIMESTAMPTZ NULL,
  ADD COLUMN review_due_at TIMESTAMPTZ NULL;
CREATE INDEX courses_review_queue_idx ON public.courses(review_status,review_due_at,updated_at,id) WHERE review_status='submitted';

CREATE TABLE public.course_review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  revision_id UUID NOT NULL REFERENCES public.course_revisions(id) ON DELETE RESTRICT, reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK(category IN('course_details','pricing','instructor','media','curriculum','quiz','assignment','accessibility','seo','other')),
  severity TEXT NOT NULL CHECK(severity IN('warning','blocking')), target_type TEXT NULL, target_id UUID NULL,
  comment TEXT NOT NULL CHECK(char_length(trim(comment))>=5), status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX course_review_findings_revision_status_idx ON public.course_review_findings(revision_id,status,created_at);
ALTER TABLE public.course_review_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors view own review findings" ON public.course_review_findings FOR SELECT TO authenticated
  USING(EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.author_id=auth.uid()));
CREATE POLICY "Admins manage review findings" ON public.course_review_findings FOR ALL TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_claim_course_review(p_course_id UUID,p_claim BOOLEAN DEFAULT TRUE) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.review_status<>'submitted' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Only submitted courses can be assigned'; END IF;
  IF p_claim AND c.review_assignee_id IS NOT NULL AND c.review_assignee_id<>auth.uid() THEN RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='This review is already assigned to another administrator'; END IF;
  IF NOT p_claim AND c.review_assignee_id<>auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Only the assigned reviewer can release this review'; END IF;
  UPDATE public.courses SET review_assignee_id=CASE WHEN p_claim THEN auth.uid() ELSE NULL END,
    review_claimed_at=CASE WHEN p_claim THEN now() ELSE NULL END,review_due_at=CASE WHEN p_claim THEN now()+interval '3 days' ELSE NULL END,updated_at=now() WHERE id=p_course_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_save_course_review_finding(p_course_id UUID,p_category TEXT,p_severity TEXT,p_comment TEXT,p_target_type TEXT DEFAULT NULL,p_target_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  SELECT * INTO c FROM public.courses WHERE id=p_course_id;
  IF c.review_status<>'submitted' OR c.submitted_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Only submitted revisions can receive findings'; END IF;
  IF c.review_assignee_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Claim this review before adding findings'; END IF;
  INSERT INTO public.course_review_findings(course_id,revision_id,reviewer_id,category,severity,target_type,target_id,comment)
  VALUES(c.id,c.submitted_revision_id,auth.uid(),p_category,p_severity,nullif(trim(p_target_type),''),p_target_id,trim(p_comment)) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_course_review_finding_status(p_finding_id UUID,p_status TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin() OR p_status NOT IN('open','resolved','dismissed') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  UPDATE public.course_review_findings SET status=p_status,updated_at=now() WHERE id=p_finding_id;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Review finding not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_course_review_workspace(p_course_id UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  SELECT * INTO c FROM public.courses WHERE id=p_course_id;
  IF c.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Course not found'; END IF;
  RETURN jsonb_build_object('course',jsonb_build_object('id',c.id,'title',c.title,'review_status',c.review_status,'assignee_id',c.review_assignee_id,'claimed_at',c.review_claimed_at,'due_at',c.review_due_at),
    'revision',(SELECT jsonb_build_object('id',r.id,'number',r.revision_number,'snapshot',r.snapshot,'created_at',r.created_at) FROM public.course_revisions r WHERE r.id=c.submitted_revision_id),
    'readiness',public.get_course_readiness(c.id),
    'findings',COALESCE((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC) FROM public.course_review_findings f WHERE f.revision_id=c.submitted_revision_id),'[]'::jsonb),
    'history',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.id,'event_type',e.event_type,'notes',e.notes,'created_at',e.created_at,'actor_name',u.full_name) ORDER BY e.created_at DESC) FROM public.course_review_events e LEFT JOIN public.users u ON u.id=e.actor_id WHERE e.course_id=c.id),'[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_course_review(p_course_id UUID,p_decision TEXT,p_notes TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; readiness JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  IF p_decision NOT IN('approved','changes_requested','rejected') OR char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='A valid decision and actionable review note are required'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.authoring_status<>'in_review' OR c.review_status<>'submitted' OR c.submitted_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='This course review is no longer actionable'; END IF;
  IF c.review_assignee_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Claim this review before making a decision'; END IF;
  PERFORM public.assert_course_matches_revision(p_course_id,c.submitted_revision_id);
  IF p_decision='approved' THEN
    IF EXISTS(SELECT 1 FROM public.course_review_findings f WHERE f.revision_id=c.submitted_revision_id AND f.status='open' AND f.severity='blocking') THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Resolve every blocking finding before approval'; END IF;
    readiness:=public.get_course_readiness(p_course_id);
    IF NOT (readiness->>'ready')::boolean THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Course is no longer ready for approval',DETAIL=readiness::text; END IF;
  END IF;
  UPDATE public.courses SET authoring_status=CASE WHEN p_decision='approved' THEN 'approved' ELSE 'draft' END,review_status=p_decision,
    approved_revision_id=CASE WHEN p_decision='approved' THEN submitted_revision_id ELSE NULL END,review_assignee_id=NULL,review_claimed_at=NULL,review_due_at=NULL,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id) VALUES(p_course_id,auth.uid(),p_decision,trim(p_notes),c.submitted_revision_id);
END $$;

DROP FUNCTION IF EXISTS public.admin_list_course_reviews();
CREATE FUNCTION public.admin_list_course_reviews(p_query TEXT DEFAULT '',p_limit INTEGER DEFAULT 25,p_cursor TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE(course_id UUID,title TEXT,author_name TEXT,submitted_at TIMESTAMPTZ,assignee_id UUID,assignee_name TEXT,due_at TIMESTAMPTZ,open_findings BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT c.id,c.title,u.full_name,e.submitted_at,c.review_assignee_id,reviewer.full_name,c.review_due_at,
    (SELECT count(*) FROM public.course_review_findings f WHERE f.revision_id=c.submitted_revision_id AND f.status='open')
  FROM public.courses c LEFT JOIN public.users u ON u.id=c.author_id LEFT JOIN public.users reviewer ON reviewer.id=c.review_assignee_id
  CROSS JOIN LATERAL(SELECT max(created_at) submitted_at FROM public.course_review_events WHERE course_id=c.id AND event_type='submitted') e
  WHERE public.is_admin() AND c.review_status='submitted' AND (trim(p_query)='' OR c.title ILIKE '%'||trim(p_query)||'%' OR u.full_name ILIKE '%'||trim(p_query)||'%')
    AND (p_cursor IS NULL OR e.submitted_at<p_cursor)
  ORDER BY e.submitted_at DESC,c.id LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

REVOKE ALL ON FUNCTION public.admin_claim_course_review(UUID,BOOLEAN),public.admin_save_course_review_finding(UUID,TEXT,TEXT,TEXT,TEXT,UUID),public.admin_set_course_review_finding_status(UUID,TEXT),public.admin_get_course_review_workspace(UUID),public.admin_list_course_reviews(TEXT,INTEGER,TIMESTAMPTZ),public.admin_decide_course_review(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_claim_course_review(UUID,BOOLEAN),public.admin_save_course_review_finding(UUID,TEXT,TEXT,TEXT,TEXT,UUID),public.admin_set_course_review_finding_status(UUID,TEXT),public.admin_get_course_review_workspace(UUID),public.admin_list_course_reviews(TEXT,INTEGER,TIMESTAMPTZ),public.admin_decide_course_review(UUID,TEXT,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

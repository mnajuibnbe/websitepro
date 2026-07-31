-- Phase 2: admin finalization and atomic approval-to-publication workflow.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_finalize_course_for_review(p_course_id UUID,p_notes TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;readiness JSONB;revision public.course_revisions;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
 PERFORM public.lock_course_workflow(p_course_id);SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Course not found'; END IF;
 IF c.author_id IS NOT NULL AND c.author_id<>auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Only an administrator-owned draft can use admin finalization'; END IF;
 IF c.authoring_status<>'draft' OR c.review_status NOT IN('not_submitted','changes_requested','rejected') OR c.status<>'draft' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Course cannot be finalized from its current state'; END IF;
 readiness:=public.get_course_readiness(p_course_id);IF NOT(readiness->>'ready')::BOOLEAN THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Complete every readiness check before finalizing',DETAIL=readiness::TEXT;END IF;
 revision:=public.create_course_revision(p_course_id);
 UPDATE public.courses SET authoring_status='in_review',review_status='submitted',submitted_revision_id=revision.id,approved_revision_id=NULL,review_assignee_id=NULL,review_claimed_at=NULL,review_due_at=NULL,version=version+1,updated_at=now() WHERE id=p_course_id;
 INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id)VALUES(p_course_id,auth.uid(),'submitted',COALESCE(nullif(trim(p_notes),''),'Finalized by administrator'),revision.id);
 RETURN revision.id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_course_review(p_course_id UUID,p_decision TEXT,p_notes TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;readiness JSONB;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
 IF p_decision NOT IN('approved','changes_requested','rejected') OR char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='A valid decision and actionable review note are required'; END IF;
 PERFORM public.lock_course_workflow(p_course_id);SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
 IF c.authoring_status<>'in_review' OR c.review_status<>'submitted' OR c.submitted_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='This course review is no longer actionable'; END IF;
 IF c.review_assignee_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Claim this review before making a decision'; END IF;
 PERFORM public.assert_course_matches_revision(p_course_id,c.submitted_revision_id);
 IF p_decision='approved' THEN
  IF EXISTS(SELECT 1 FROM public.course_review_findings WHERE revision_id=c.submitted_revision_id AND status='open' AND severity='blocking') THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Resolve every blocking finding before approval'; END IF;
  readiness:=public.get_course_readiness(p_course_id);IF NOT(readiness->>'ready')::BOOLEAN THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Course is no longer ready for approval',DETAIL=readiness::TEXT;END IF;
 END IF;
 UPDATE public.courses SET authoring_status=CASE WHEN p_decision='approved' THEN 'approved' ELSE 'draft' END,review_status=p_decision,approved_revision_id=CASE WHEN p_decision='approved' THEN submitted_revision_id ELSE NULL END,status=CASE WHEN p_decision='approved' THEN 'published' ELSE 'draft' END,published_at=CASE WHEN p_decision='approved' THEN COALESCE(published_at,now()) ELSE published_at END,review_assignee_id=NULL,review_claimed_at=NULL,review_due_at=NULL,version=version+1,updated_at=now() WHERE id=p_course_id;
 INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id)VALUES(p_course_id,auth.uid(),p_decision,trim(p_notes),c.submitted_revision_id);
 IF p_decision='approved' THEN INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id)VALUES(p_course_id,auth.uid(),'published','Published automatically after approval',c.submitted_revision_id);END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_finalize_course_for_review(UUID,TEXT),public.admin_decide_course_review(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_finalize_course_for_review(UUID,TEXT),public.admin_decide_course_review(UUID,TEXT,TEXT) TO authenticated;
INSERT INTO public.platform_feature_releases(release_key,applied_by,details)VALUES('review-auto-publication-v1',auth.uid(),jsonb_build_object('migration','20260730080000','admin_finalize',true,'approval_auto_publishes',true))ON CONFLICT(release_key)DO NOTHING;
NOTIFY pgrst,'reload schema';COMMIT;

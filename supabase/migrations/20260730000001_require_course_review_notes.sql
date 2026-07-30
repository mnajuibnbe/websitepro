-- Every admin course-review decision must leave an auditable explanation.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_decide_course_review(p_course_id UUID,p_decision TEXT,p_notes TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
 IF p_decision NOT IN('approved','changes_requested','rejected') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid review decision'; END IF;
 IF char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='A review note of at least 5 characters is required for every decision'; END IF;
 SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
 IF c.review_status<>'submitted' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Only submitted courses can be reviewed'; END IF;
 UPDATE public.courses SET authoring_status=CASE WHEN p_decision='approved' THEN 'approved' ELSE 'draft' END,review_status=p_decision,updated_at=now() WHERE id=p_course_id;
 INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes) VALUES(p_course_id,auth.uid(),p_decision,trim(p_notes));
END $$;
REVOKE ALL ON FUNCTION public.admin_decide_course_review(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_decide_course_review(UUID,TEXT,TEXT) TO authenticated;
COMMIT;

-- Phase 3: governed instructor lifecycle, history, and suspension safety.
BEGIN;

CREATE TABLE public.instructor_application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), application_id UUID NOT NULL REFERENCES public.instructor_applications(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, from_status TEXT NULL, to_status TEXT NOT NULL,
  notes TEXT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX instructor_application_events_application_created_idx ON public.instructor_application_events(application_id,created_at DESC);
ALTER TABLE public.instructor_application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants view own instructor history" ON public.instructor_application_events FOR SELECT TO authenticated
  USING(EXISTS(SELECT 1 FROM public.instructor_applications a WHERE a.id=application_id AND a.user_id=auth.uid()));
CREATE POLICY "Admins view instructor history" ON public.instructor_application_events FOR SELECT TO authenticated USING(public.is_admin());

CREATE OR REPLACE FUNCTION public.submit_instructor_application(
  p_professional_name TEXT,p_bio TEXT,p_expertise TEXT[],p_credentials TEXT,p_portfolio_url TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID; v_previous TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Authentication required'; END IF;
  SELECT status INTO v_previous FROM public.instructor_applications WHERE user_id=auth.uid() FOR UPDATE;
  IF v_previous IS NOT NULL AND v_previous NOT IN('changes_requested','rejected') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Application cannot be submitted from its current state'; END IF;
  INSERT INTO public.instructor_applications(user_id,professional_name,bio,expertise,credentials,portfolio_url,status,submitted_at,updated_at)
  VALUES(auth.uid(),trim(p_professional_name),trim(p_bio),p_expertise,trim(p_credentials),nullif(trim(p_portfolio_url),''),'submitted',now(),now())
  ON CONFLICT(user_id) DO UPDATE SET professional_name=EXCLUDED.professional_name,bio=EXCLUDED.bio,expertise=EXCLUDED.expertise,
    credentials=EXCLUDED.credentials,portfolio_url=EXCLUDED.portfolio_url,status='submitted',reviewer_id=NULL,reviewer_notes=NULL,submitted_at=now(),reviewed_at=NULL,updated_at=now()
  RETURNING id INTO v_id;
  INSERT INTO public.instructor_application_events(application_id,actor_id,from_status,to_status)
  VALUES(v_id,auth.uid(),v_previous,'submitted');
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_instructor_application(p_application_id UUID,p_decision TEXT,p_notes TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.instructor_applications; v_allowed BOOLEAN:=FALSE; v_course RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  IF char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Review notes must contain at least 5 characters'; END IF;
  SELECT * INTO a FROM public.instructor_applications WHERE id=p_application_id FOR UPDATE;
  IF a.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Application not found'; END IF;
  v_allowed:=(a.status='submitted' AND p_decision IN('under_review','approved','changes_requested','rejected')) OR
    (a.status='under_review' AND p_decision IN('approved','changes_requested','rejected')) OR
    (a.status='approved' AND p_decision='suspended') OR
    (a.status='suspended' AND p_decision IN('approved','rejected'));
  IF NOT v_allowed THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Instructor transition is not allowed from the current state'; END IF;
  UPDATE public.instructor_applications SET status=p_decision,reviewer_id=auth.uid(),reviewer_notes=trim(p_notes),reviewed_at=now(),updated_at=now() WHERE id=p_application_id;
  INSERT INTO public.instructor_application_events(application_id,actor_id,from_status,to_status,notes) VALUES(a.id,auth.uid(),a.status,p_decision,trim(p_notes));
  IF p_decision='approved' THEN
    INSERT INTO public.instructor_public_profiles(user_id,professional_name,bio,expertise,credentials,approved_at,updated_at)
    VALUES(a.user_id,a.professional_name,a.bio,a.expertise,a.credentials,now(),now())
    ON CONFLICT(user_id) DO UPDATE SET professional_name=EXCLUDED.professional_name,bio=EXCLUDED.bio,expertise=EXCLUDED.expertise,credentials=EXCLUDED.credentials,is_public=TRUE,updated_at=now();
    UPDATE public.users SET role='instructor' WHERE id=a.user_id AND role<>'admin';
    UPDATE auth.users SET raw_app_meta_data=COALESCE(raw_app_meta_data,'{}'::jsonb)||'{"role":"instructor"}'::jsonb WHERE id=a.user_id AND COALESCE(raw_app_meta_data->>'role','')<>'admin';
  ELSIF p_decision IN('suspended','rejected') AND a.status IN('approved','suspended') THEN
    UPDATE public.instructor_public_profiles SET is_public=FALSE,updated_at=now() WHERE user_id=a.user_id;
    UPDATE public.users SET role='student' WHERE id=a.user_id AND role<>'admin';
    UPDATE auth.users SET raw_app_meta_data=COALESCE(raw_app_meta_data,'{}'::jsonb)||'{"role":"student"}'::jsonb WHERE id=a.user_id AND COALESCE(raw_app_meta_data->>'role','')<>'admin';
    FOR v_course IN UPDATE public.courses SET status='draft',updated_at=now()
      WHERE status='published' AND (author_id=a.user_id OR instructor_id=a.user_id) RETURNING id,approved_revision_id LOOP
      INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id)
      VALUES(v_course.id,auth.uid(),'unpublished','Instructor access was suspended.',v_course.approved_revision_id);
    END LOOP;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.submit_instructor_application(TEXT,TEXT,TEXT[],TEXT,TEXT), public.admin_review_instructor_application(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_instructor_application(TEXT,TEXT,TEXT[],TEXT,TEXT), public.admin_review_instructor_application(UUID,TEXT,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

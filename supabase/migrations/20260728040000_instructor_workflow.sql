-- Phase 4: controlled instructor application, approval, ownership, and public profile workflow.
BEGIN;

CREATE TABLE IF NOT EXISTS public.instructor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT,
  professional_name TEXT NOT NULL, bio TEXT NOT NULL, expertise TEXT[] NOT NULL DEFAULT '{}',
  credentials TEXT NOT NULL, portfolio_url TEXT NULL, status TEXT NOT NULL DEFAULT 'submitted',
  reviewer_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL, reviewer_notes TEXT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT instructor_application_status_check CHECK (status IN ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'suspended')),
  CONSTRAINT instructor_application_quality_check CHECK (char_length(trim(professional_name)) >= 2 AND char_length(trim(bio)) >= 80 AND char_length(trim(credentials)) >= 20 AND cardinality(expertise) > 0)
);

CREATE TABLE IF NOT EXISTS public.instructor_public_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
  professional_name TEXT NOT NULL, bio TEXT NOT NULL, expertise TEXT[] NOT NULL DEFAULT '{}',
  credentials TEXT NOT NULL, avatar_url TEXT NULL, is_public BOOLEAN NOT NULL DEFAULT TRUE,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_public_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Applicants view own instructor application" ON public.instructor_applications;
DROP POLICY IF EXISTS "Admins view instructor applications" ON public.instructor_applications;
DROP POLICY IF EXISTS "Public views approved instructor profiles" ON public.instructor_public_profiles;
DROP POLICY IF EXISTS "Admins manage instructor profiles" ON public.instructor_public_profiles;
CREATE POLICY "Applicants view own instructor application" ON public.instructor_applications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view instructor applications" ON public.instructor_applications FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Public views approved instructor profiles" ON public.instructor_public_profiles FOR SELECT TO anon, authenticated USING (is_public = TRUE);
CREATE POLICY "Admins manage instructor profiles" ON public.instructor_public_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.is_approved_instructor(p_user_id UUID DEFAULT auth.uid()) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.instructor_applications WHERE user_id = p_user_id AND status = 'approved');
$$;

CREATE OR REPLACE FUNCTION public.submit_instructor_application(
  p_professional_name TEXT, p_bio TEXT, p_expertise TEXT[], p_credentials TEXT, p_portfolio_url TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required'; END IF;
  IF EXISTS (SELECT 1 FROM public.instructor_applications WHERE user_id = auth.uid() AND status IN ('submitted','under_review','approved','suspended')) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'An active instructor application already exists';
  END IF;
  INSERT INTO public.instructor_applications(user_id, professional_name, bio, expertise, credentials, portfolio_url, status, submitted_at, updated_at)
  VALUES (auth.uid(), trim(p_professional_name), trim(p_bio), p_expertise, trim(p_credentials), nullif(trim(p_portfolio_url), ''), 'submitted', now(), now())
  ON CONFLICT (user_id) DO UPDATE SET professional_name = EXCLUDED.professional_name, bio = EXCLUDED.bio,
    expertise = EXCLUDED.expertise, credentials = EXCLUDED.credentials, portfolio_url = EXCLUDED.portfolio_url,
    status = 'submitted', reviewer_id = NULL, reviewer_notes = NULL, submitted_at = now(), reviewed_at = NULL, updated_at = now()
  RETURNING id INTO v_id; RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_instructor_application(p_application_id UUID, p_decision TEXT, p_notes TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_application public.instructor_applications;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required'; END IF;
  IF p_decision NOT IN ('under_review','changes_requested','approved','rejected','suspended') THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid review decision'; END IF;
  SELECT * INTO v_application FROM public.instructor_applications WHERE id = p_application_id FOR UPDATE;
  IF v_application.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Application not found'; END IF;
  UPDATE public.instructor_applications SET status = p_decision, reviewer_id = auth.uid(), reviewer_notes = nullif(trim(p_notes), ''), reviewed_at = now(), updated_at = now() WHERE id = p_application_id;
  IF p_decision = 'approved' THEN
    INSERT INTO public.instructor_public_profiles(user_id, professional_name, bio, expertise, credentials, approved_at, updated_at)
    VALUES (v_application.user_id, v_application.professional_name, v_application.bio, v_application.expertise, v_application.credentials, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET professional_name = EXCLUDED.professional_name, bio = EXCLUDED.bio, expertise = EXCLUDED.expertise, credentials = EXCLUDED.credentials, is_public = TRUE, updated_at = now();
    UPDATE public.users SET role = 'instructor' WHERE id = v_application.user_id AND role <> 'admin';
    UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"instructor"}'::jsonb WHERE id = v_application.user_id;
  ELSIF p_decision = 'suspended' THEN
    UPDATE public.instructor_public_profiles SET is_public = FALSE, updated_at = now() WHERE user_id = v_application.user_id;
    UPDATE public.users SET role = 'student' WHERE id = v_application.user_id;
    UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"student"}'::jsonb WHERE id = v_application.user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_approved_instructors(p_query TEXT DEFAULT '', p_limit INTEGER DEFAULT 20)
RETURNS TABLE(user_id UUID, professional_name TEXT, email TEXT, expertise TEXT[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ip.user_id, ip.professional_name, u.email, ip.expertise FROM public.instructor_public_profiles ip JOIN public.users u ON u.id = ip.user_id
  WHERE public.is_admin() AND ip.is_public AND (trim(p_query) = '' OR ip.professional_name ILIKE '%' || trim(p_query) || '%' OR u.email ILIKE '%' || trim(p_query) || '%')
  ORDER BY ip.professional_name LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

CREATE OR REPLACE FUNCTION public.get_public_course_instructor(p_course_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN ip.user_id IS NULL THEN NULL ELSE jsonb_build_object('professional_name', ip.professional_name, 'bio', ip.bio, 'expertise', ip.expertise, 'credentials', ip.credentials, 'avatar_url', ip.avatar_url) END
  FROM public.courses c LEFT JOIN public.instructor_public_profiles ip ON ip.user_id = c.instructor_id AND ip.is_public
  WHERE c.id = p_course_id AND c.status = 'published' AND COALESCE(c.visibility, 'public') = 'public';
$$;

CREATE OR REPLACE FUNCTION public.can_author_course(p_course_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id AND author_id = auth.uid() AND status = 'draft' AND authoring_status = 'draft' AND public.is_approved_instructor(auth.uid()));
$$;

DROP POLICY IF EXISTS "Approved instructors view own courses" ON public.courses;
DROP POLICY IF EXISTS "Approved instructors update own drafts" ON public.courses;
DROP POLICY IF EXISTS "Approved instructors manage own sections" ON public.course_sections;
DROP POLICY IF EXISTS "Approved instructors manage own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Approved instructors upload own course covers" ON storage.objects;
CREATE POLICY "Approved instructors view own courses" ON public.courses FOR SELECT TO authenticated USING (author_id = auth.uid() AND public.is_approved_instructor(auth.uid()));
CREATE POLICY "Approved instructors update own drafts" ON public.courses FOR UPDATE TO authenticated USING (public.can_author_course(id)) WITH CHECK (author_id = auth.uid() AND status = 'draft');
CREATE POLICY "Approved instructors manage own sections" ON public.course_sections FOR ALL TO authenticated USING (public.can_author_course(course_id)) WITH CHECK (public.can_author_course(course_id));
CREATE POLICY "Approved instructors manage own lessons" ON public.lessons FOR ALL TO authenticated USING (public.can_author_course(course_id)) WITH CHECK (public.can_author_course(course_id));
CREATE POLICY "Approved instructors upload own course covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-covers' AND public.is_approved_instructor(auth.uid()) AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE OR REPLACE FUNCTION public.instructor_create_course_dual(
  p_title TEXT, p_short_description TEXT, p_description TEXT, p_category TEXT, p_level TEXT,
  p_language TEXT, p_price_egp NUMERIC, p_price_usd NUMERIC, p_thumbnail TEXT, p_cover_image TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.is_approved_instructor(auth.uid()) THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Approved instructor access required'; END IF;
  IF p_price_egp IS NULL OR p_price_usd IS NULL OR p_price_egp < 0 OR p_price_usd < 0 OR (p_price_egp = 0) <> (p_price_usd = 0) THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Valid regional prices are required'; END IF;
  INSERT INTO public.courses(title, short_description, description, category, level, language, price_egp, price_usd, instructor_id, author_id, thumbnail, cover_image, status, authoring_status, review_status)
  VALUES(trim(p_title), nullif(trim(p_short_description),''), nullif(trim(p_description),''), p_category, p_level, p_language, p_price_egp, p_price_usd, auth.uid(), auth.uid(), p_thumbnail, p_cover_image, 'draft', 'draft', 'not_submitted') RETURNING id INTO v_id;
  INSERT INTO public.course_sections(course_id, title, order_index, is_published) VALUES(v_id, 'Course content', 0, FALSE);
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.can_author_course(UUID), public.instructor_create_course_dual(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_author_course(UUID), public.instructor_create_course_dual(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,TEXT,TEXT) TO authenticated;

-- Replace the canonical lesson writer with ownership-aware authorization.
CREATE OR REPLACE FUNCTION public.admin_upsert_lesson(
  p_course_id UUID,
  p_section_id UUID,
  p_lesson_id UUID,
  p_title TEXT,
  p_content_type TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB,
  p_expected_version BIGINT DEFAULT NULL
) RETURNS public.lessons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_lesson public.lessons; v_order INTEGER;
BEGIN
  IF NOT public.can_author_course(p_course_id) THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Course author access required'; END IF;
  IF p_title IS NULL OR trim(p_title) = '' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Lesson title is required'; END IF;
  IF p_content_type NOT IN ('video', 'pdf', 'external_link', 'quiz', 'assignment') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Unsupported lesson content type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.course_sections WHERE id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Section does not belong to course';
  END IF;

  IF p_lesson_id IS NULL THEN
    SELECT COALESCE(MAX(order_index), -1) + 1 INTO v_order FROM public.lessons
      WHERE course_id = p_course_id AND section_id = p_section_id AND deleted_at IS NULL;
    INSERT INTO public.lessons (
      course_id, section_id, title, content_type, lesson_type, type, description, content,
      video_url, content_url, transcript, captions_url, notes, pdf_allow_download,
      pdf_watermark, open_in_new_tab, is_preview, is_published, completion_rule, order_index
    ) VALUES (
      p_course_id, p_section_id, trim(p_title), p_content_type, p_content_type,
      CASE WHEN p_content_type = 'quiz' THEN 'quiz' WHEN p_content_type IN ('pdf', 'external_link') THEN 'text' ELSE 'video' END,
      nullif(trim(p_payload->>'description'), ''), p_payload->>'content', nullif(trim(p_payload->>'video_url'), ''),
      nullif(trim(p_payload->>'content_url'), ''), p_payload->>'transcript', nullif(trim(p_payload->>'captions_url'), ''),
      p_payload->>'notes', COALESCE((p_payload->>'pdf_allow_download')::BOOLEAN, TRUE),
      COALESCE((p_payload->>'pdf_watermark')::BOOLEAN, FALSE), COALESCE((p_payload->>'open_in_new_tab')::BOOLEAN, FALSE),
      COALESCE((p_payload->>'is_preview')::BOOLEAN, FALSE), COALESCE((p_payload->>'is_published')::BOOLEAN, TRUE),
      COALESCE(nullif(p_payload->>'completion_rule', ''), CASE p_content_type WHEN 'video' THEN 'watch90' WHEN 'quiz' THEN 'pass_quiz' WHEN 'assignment' THEN 'upload_assignment' ELSE 'open_resource' END),
      v_order
    ) RETURNING * INTO v_lesson;
  ELSE
    UPDATE public.lessons SET
      section_id = p_section_id, title = trim(p_title), content_type = p_content_type,
      lesson_type = p_content_type,
      type = CASE WHEN p_content_type = 'quiz' THEN 'quiz' WHEN p_content_type IN ('pdf', 'external_link') THEN 'text' ELSE 'video' END,
      description = nullif(trim(p_payload->>'description'), ''), content = p_payload->>'content',
      video_url = nullif(trim(p_payload->>'video_url'), ''), content_url = nullif(trim(p_payload->>'content_url'), ''),
      transcript = p_payload->>'transcript', captions_url = nullif(trim(p_payload->>'captions_url'), ''), notes = p_payload->>'notes',
      pdf_allow_download = COALESCE((p_payload->>'pdf_allow_download')::BOOLEAN, pdf_allow_download),
      pdf_watermark = COALESCE((p_payload->>'pdf_watermark')::BOOLEAN, pdf_watermark),
      open_in_new_tab = COALESCE((p_payload->>'open_in_new_tab')::BOOLEAN, open_in_new_tab),
      is_preview = COALESCE((p_payload->>'is_preview')::BOOLEAN, is_preview),
      is_published = COALESCE((p_payload->>'is_published')::BOOLEAN, is_published),
      completion_rule = COALESCE(nullif(p_payload->>'completion_rule', ''), completion_rule),
      version = version + 1, updated_at = now()
    WHERE id = p_lesson_id AND course_id = p_course_id AND deleted_at IS NULL
      AND (p_expected_version IS NULL OR version = p_expected_version)
    RETURNING * INTO v_lesson;
    IF v_lesson.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Lesson was changed or no longer exists'; END IF;
  END IF;
  RETURN v_lesson;
END;
$$;


CREATE OR REPLACE FUNCTION public.admin_set_lesson_video_metadata(
  p_lesson_id UUID, p_video_url TEXT, p_provider TEXT, p_duration_seconds INTEGER, p_status TEXT
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id AND public.can_author_course(course_id)) THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Course author access required'; END IF;
  IF p_status NOT IN ('pending', 'ready', 'unavailable', 'failed') THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid metadata status'; END IF;
  IF p_status = 'ready' AND (p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Ready video metadata requires duration'; END IF;
  UPDATE public.lessons SET video_url = p_video_url, video_provider = p_provider,
    video_duration_seconds = CASE WHEN p_status = 'ready' THEN p_duration_seconds ELSE NULL END,
    estimated_minutes = CASE WHEN p_status = 'ready' THEN CEIL(p_duration_seconds / 60.0)::INTEGER ELSE 0 END,
    duration = CASE WHEN p_status = 'ready' THEN CEIL(p_duration_seconds / 60.0)::INTEGER || ' min' ELSE NULL END,
    video_metadata_status = p_status, video_metadata_updated_at = now(), updated_at = now()
  WHERE id = p_lesson_id AND content_type = 'video' AND deleted_at IS NULL RETURNING course_id INTO v_course_id;
  IF v_course_id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Video lesson not found'; END IF;
  RETURN public.recalculate_course_video_duration(v_course_id);
END;
$$;


REVOKE ALL ON FUNCTION public.is_approved_instructor(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_instructor_application(TEXT,TEXT,TEXT[],TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_instructor_application(UUID,TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_search_approved_instructors(TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_course_instructor(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_instructor(UUID), public.submit_instructor_application(TEXT,TEXT,TEXT[],TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_instructor_application(UUID,TEXT,TEXT), public.admin_search_approved_instructors(TEXT,INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_course_instructor(UUID) TO anon, authenticated;

COMMIT;

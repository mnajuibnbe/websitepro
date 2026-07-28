-- Phase 3: managed course covers and backend-owned video duration metadata.
BEGIN;

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-covers', 'course-covers', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins upload course covers" ON storage.objects;
CREATE POLICY "Admins upload course covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-covers' AND public.is_admin() AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Admins update course covers" ON storage.objects;
CREATE POLICY "Admins update course covers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin()) WITH CHECK (bucket_id = 'course-covers' AND public.is_admin());
DROP POLICY IF EXISTS "Admins delete course covers" ON storage.objects;
CREATE POLICY "Admins delete course covers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin());

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_provider TEXT NULL,
  ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER NULL,
  ADD COLUMN IF NOT EXISTS video_metadata_status TEXT NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS video_metadata_updated_at TIMESTAMPTZ NULL;
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_video_duration_positive;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_video_duration_positive
  CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0);
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_video_metadata_status_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_video_metadata_status_check
  CHECK (video_metadata_status IN ('not_applicable', 'pending', 'ready', 'unavailable', 'failed'));

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_video_duration_seconds BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recalculate_course_video_duration(p_course_id UUID)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total BIGINT;
BEGIN
  SELECT COALESCE(sum(l.video_duration_seconds), 0) INTO v_total FROM public.lessons l
  JOIN public.course_sections s ON s.id = l.section_id AND s.course_id = l.course_id
  WHERE l.course_id = p_course_id AND l.content_type = 'video' AND l.is_published = TRUE AND l.deleted_at IS NULL
    AND s.is_published = TRUE AND s.deleted_at IS NULL;
  UPDATE public.courses SET total_video_duration_seconds = v_total WHERE id = p_course_id;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_course_video_duration()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalculate_course_video_duration(COALESCE(NEW.course_id, OLD.course_id));
  IF TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id THEN
    PERFORM public.recalculate_course_video_duration(OLD.course_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trg_lessons_sync_video_duration ON public.lessons;
CREATE TRIGGER trg_lessons_sync_video_duration AFTER INSERT OR UPDATE OF video_duration_seconds, is_published, deleted_at, course_id OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.sync_course_video_duration();
DROP TRIGGER IF EXISTS trg_sections_sync_video_duration ON public.course_sections;
CREATE TRIGGER trg_sections_sync_video_duration AFTER UPDATE OF is_published, deleted_at OR DELETE ON public.course_sections
FOR EACH ROW EXECUTE FUNCTION public.sync_course_video_duration();

CREATE OR REPLACE FUNCTION public.admin_set_lesson_video_metadata(
  p_lesson_id UUID, p_video_url TEXT, p_provider TEXT, p_duration_seconds INTEGER, p_status TEXT
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required'; END IF;
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

REVOKE ALL ON FUNCTION public.recalculate_course_video_duration(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) TO authenticated;

UPDATE public.courses c SET total_video_duration_seconds = COALESCE((SELECT sum(l.video_duration_seconds) FROM public.lessons l JOIN public.course_sections s ON s.id = l.section_id AND s.course_id = l.course_id WHERE l.course_id = c.id AND l.content_type = 'video' AND l.is_published AND l.deleted_at IS NULL AND s.is_published AND s.deleted_at IS NULL), 0);

COMMIT;

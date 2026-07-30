-- Complete the instructor-authoring repair after the enum migration commits.
BEGIN;

-- Restore the ownership-aware canonical lesson writer.
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

-- Restore the ownership-aware metadata writer.
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

-- Repair roles only for approved applications; existing admins stay admins.
UPDATE public.users AS u
SET role = 'instructor'
FROM public.instructor_applications AS ia
WHERE ia.user_id = u.id
  AND ia.status = 'approved'
  AND u.role <> 'admin';

UPDATE auth.users AS au
SET raw_app_meta_data = COALESCE(au.raw_app_meta_data, '{}'::jsonb) || '{"role":"instructor"}'::jsonb
FROM public.instructor_applications AS ia
WHERE ia.user_id = au.id
  AND ia.status = 'approved'
  AND COALESCE(au.raw_app_meta_data->>'role', '') <> 'admin';

REVOKE ALL ON FUNCTION public.admin_upsert_lesson(UUID,UUID,UUID,TEXT,TEXT,JSONB,BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_lesson(UUID,UUID,UUID,TEXT,TEXT,JSONB,BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Repair admin actions reported during course authoring acceptance testing.
BEGIN;

-- `lessons.duration` exists as INTEGER in older installations and TEXT in newer
-- ones. Duration metadata has dedicated numeric columns, so do not write a
-- formatted string into this legacy column.
CREATE OR REPLACE FUNCTION public.admin_set_lesson_video_metadata(
  p_lesson_id UUID, p_video_url TEXT, p_provider TEXT, p_duration_seconds INTEGER, p_status TEXT
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course_id UUID;
BEGIN
  IF NOT public.can_author_course((SELECT course_id FROM public.lessons WHERE id = p_lesson_id)) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Course author access required';
  END IF;
  IF p_status NOT IN ('pending', 'ready', 'unavailable', 'failed') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid metadata status';
  END IF;
  IF p_status = 'ready' AND (p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Ready video metadata requires duration';
  END IF;

  UPDATE public.lessons SET
    video_url = p_video_url,
    video_provider = p_provider,
    video_duration_seconds = CASE WHEN p_status = 'ready' THEN p_duration_seconds ELSE NULL END,
    estimated_minutes = CASE WHEN p_status = 'ready' THEN CEIL(p_duration_seconds / 60.0)::INTEGER ELSE 0 END,
    video_metadata_status = p_status,
    video_metadata_updated_at = now(),
    updated_at = now()
  WHERE id = p_lesson_id AND content_type = 'video' AND deleted_at IS NULL
  RETURNING course_id INTO v_course_id;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Video lesson not found';
  END IF;
  RETURN public.recalculate_course_video_duration(v_course_id);
END;
$$;

-- A course with no enrollment/order history can be removed. Review events are
-- internal workflow records and should not make an otherwise empty draft
-- impossible to delete.
CREATE OR REPLACE FUNCTION public.admin_delete_empty_course(p_course_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Course not found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = p_course_id)
     OR EXISTS (SELECT 1 FROM public.course_orders WHERE course_id = p_course_id) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'This course has student or order records and must be archived instead';
  END IF;

  DELETE FROM public.course_review_events WHERE course_id = p_course_id;
  DELETE FROM public.courses WHERE id = p_course_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_empty_course(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_empty_course(UUID) TO authenticated;

COMMIT;

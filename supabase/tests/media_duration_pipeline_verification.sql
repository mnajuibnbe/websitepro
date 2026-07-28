SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'course-covers';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lessons'
  AND column_name IN ('video_provider', 'video_duration_seconds', 'video_metadata_status', 'video_metadata_updated_at');

SELECT proname, prosecdef
FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND proname IN ('recalculate_course_video_duration', 'admin_set_lesson_video_metadata');

-- Must return no rows: stored course rollups match published active video lessons.
SELECT c.id, c.total_video_duration_seconds, COALESCE(sum(l.video_duration_seconds), 0) AS calculated
FROM public.courses c LEFT JOIN (public.lessons l JOIN public.course_sections s ON s.id = l.section_id AND s.course_id = l.course_id AND s.is_published AND s.deleted_at IS NULL) ON l.course_id = c.id
  AND l.content_type = 'video' AND l.is_published AND l.deleted_at IS NULL
GROUP BY c.id HAVING c.total_video_duration_seconds <> COALESCE(sum(l.video_duration_seconds), 0);

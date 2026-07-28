-- Read-only verification for the canonical course-authoring foundation.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'courses' AND column_name IN ('authoring_status', 'review_status', 'author_id', 'version'))
    OR (table_name = 'lessons' AND column_name IN ('content_type', 'version')))
ORDER BY table_name, column_name;

SELECT proname, prosecdef
FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND proname IN ('authoring_slugify', 'admin_upsert_lesson', 'admin_duplicate_lesson');

SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('admin_upsert_lesson', 'admin_duplicate_lesson')
ORDER BY routine_name, grantee;

-- Must return no rows: active lessons cannot point to a section in another course.
SELECT l.id, l.course_id AS lesson_course_id, s.course_id AS section_course_id
FROM public.lessons l
JOIN public.course_sections s ON s.id = l.section_id
WHERE l.deleted_at IS NULL AND l.course_id <> s.course_id;

-- Inventory unsupported legacy records that require an explicit migration decision.
SELECT COALESCE(lesson_type, type, 'unknown') AS legacy_type, count(*)
FROM public.lessons
WHERE deleted_at IS NULL AND content_type IS NULL
GROUP BY COALESCE(lesson_type, type, 'unknown')
ORDER BY count(*) DESC;

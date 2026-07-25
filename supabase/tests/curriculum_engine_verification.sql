-- Safe Read-Only Verification Script for Curriculum Engine Migration
-- File: supabase/tests/curriculum_engine_verification.sql

-- 1. Check if deleted_at columns exist in course_sections and lessons
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('course_sections', 'lessons') 
  AND column_name = 'deleted_at';

-- 2. Verify existence of RPC functions
SELECT 
    proname AS function_name, 
    prosecdef AS is_security_definer
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public' 
  AND proname IN (
    'admin_reorder_course_sections',
    'admin_reorder_section_lessons',
    'admin_move_lesson',
    'admin_soft_delete_lessons',
    'admin_restore_lessons',
    'admin_soft_delete_section',
    'admin_restore_section',
    'admin_duplicate_section',
    'admin_bulk_move_lessons'
  );

-- 3. Check EXECUTE permissions on RPC functions (Ensure no PUBLIC or anon permissions)
SELECT 
    routine_name, 
    grantee, 
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'admin_reorder_course_sections',
    'admin_reorder_section_lessons',
    'admin_move_lesson',
    'admin_soft_delete_lessons',
    'admin_restore_lessons',
    'admin_soft_delete_section',
    'admin_restore_section',
    'admin_duplicate_section',
    'admin_bulk_move_lessons'
  );

-- 4. Check for duplicate order_index within the same section (lessons)
SELECT 
    section_id, 
    order_index, 
    COUNT(*) AS duplicate_count
FROM public.lessons
WHERE deleted_at IS NULL AND section_id IS NOT NULL
GROUP BY section_id, order_index
HAVING COUNT(*) > 1;

-- 5. Check for duplicate order_index within the same course (sections)
SELECT 
    course_id, 
    order_index, 
    COUNT(*) AS duplicate_count
FROM public.course_sections
WHERE deleted_at IS NULL
GROUP BY course_id, order_index
HAVING COUNT(*) > 1;

-- 6. Check for orphan lessons (lessons belonging to a section from a different course)
SELECT 
    l.id AS lesson_id, 
    l.title AS lesson_title, 
    l.course_id AS lesson_course_id, 
    s.course_id AS section_course_id
FROM public.lessons l
JOIN public.course_sections s ON l.section_id = s.id
WHERE l.course_id <> s.course_id;

-- 7. Count active vs soft-deleted sections and lessons
SELECT 
    'course_sections' AS table_name,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_count,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_count
FROM public.course_sections
UNION ALL
SELECT 
    'lessons' AS table_name,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_count,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_count
FROM public.lessons;

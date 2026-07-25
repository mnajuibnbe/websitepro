-- Migration: Curriculum Engine RPCs & Soft Delete Columns
-- Date: 2026-07-25

-- 1. Ensure deleted_at column exists in course_sections and lessons
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'course_sections' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.course_sections ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.lessons ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 2. RPC: Reorder Course Sections
CREATE OR REPLACE FUNCTION public.admin_reorder_course_sections(
    p_course_id UUID,
    p_section_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_idx INTEGER;
    v_section_id UUID;
BEGIN
    -- Verify Admin Access if is_admin function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin required.';
        END IF;
    END IF;

    FOR v_idx IN 1..array_length(p_section_ids, 1) LOOP
        v_section_id := p_section_ids[v_idx];
        UPDATE public.course_sections
        SET order_index = v_idx - 1,
            updated_at = NOW()
        WHERE id = v_section_id AND course_id = p_course_id;
    END LOOP;
END;
$$;

-- 3. RPC: Reorder Section Lessons
CREATE OR REPLACE FUNCTION public.admin_reorder_section_lessons(
    p_course_id UUID,
    p_section_id UUID,
    p_lesson_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_idx INTEGER;
    v_lesson_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin required.';
        END IF;
    END IF;

    -- Verify section belongs to course
    IF NOT EXISTS (SELECT 1 FROM public.course_sections WHERE id = p_section_id AND course_id = p_course_id) THEN
        RAISE EXCEPTION 'Section does not belong to specified course.';
    END IF;

    IF p_lesson_ids IS NOT NULL AND array_length(p_lesson_ids, 1) > 0 THEN
        FOR v_idx IN 1..array_length(p_lesson_ids, 1) LOOP
            v_lesson_id := p_lesson_ids[v_idx];
            UPDATE public.lessons
            SET order_index = v_idx - 1,
                section_id = p_section_id,
                updated_at = NOW()
            WHERE id = v_lesson_id AND course_id = p_course_id;
        END LOOP;
    END IF;
END;
$$;

-- 4. RPC: Move Lesson Between Sections
CREATE OR REPLACE FUNCTION public.admin_move_lesson(
    p_course_id UUID,
    p_lesson_id UUID,
    p_destination_section_id UUID,
    p_destination_index INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_source_section_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin required.';
        END IF;
    END IF;

    -- Fetch current lesson section
    SELECT section_id INTO v_source_section_id
    FROM public.lessons
    WHERE id = p_lesson_id AND course_id = p_course_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found in specified course.';
    END IF;

    -- Verify destination section belongs to same course
    IF NOT EXISTS (SELECT 1 FROM public.course_sections WHERE id = p_destination_section_id AND course_id = p_course_id) THEN
        RAISE EXCEPTION 'Destination section does not belong to specified course.';
    END IF;

    -- Update destination section for moved lesson
    UPDATE public.lessons
    SET section_id = p_destination_section_id,
        updated_at = NOW()
    WHERE id = p_lesson_id AND course_id = p_course_id;

    -- Re-index destination section lessons
    WITH dest_ordered AS (
        SELECT id, ROW_NUMBER() OVER (
            ORDER BY 
                CASE WHEN id = p_lesson_id THEN p_destination_index * 2 + 1 ELSE order_index * 2 END ASC
        ) - 1 AS new_order
        FROM public.lessons
        WHERE section_id = p_destination_section_id AND course_id = p_course_id AND (deleted_at IS NULL)
    )
    UPDATE public.lessons l
    SET order_index = d.new_order
    FROM dest_ordered d
    WHERE l.id = d.id;

    -- Re-index source section lessons if different
    IF v_source_section_id IS NOT NULL AND v_source_section_id <> p_destination_section_id THEN
        WITH src_ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC) - 1 AS new_order
            FROM public.lessons
            WHERE section_id = v_source_section_id AND course_id = p_course_id AND (deleted_at IS NULL)
        )
        UPDATE public.lessons l
        SET order_index = s.new_order
        FROM src_ordered s
        WHERE l.id = s.id;
    END IF;
END;
$$;

-- 5. RPC: Soft Delete Lessons
CREATE OR REPLACE FUNCTION public.admin_soft_delete_lessons(
    p_lesson_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin required.';
        END IF;
    END IF;

    UPDATE public.lessons
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(p_lesson_ids);
END;
$$;

-- 6. RPC: Restore Lessons
CREATE OR REPLACE FUNCTION public.admin_restore_lessons(
    p_lesson_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin required.';
        END IF;
    END IF;

    UPDATE public.lessons
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = ANY(p_lesson_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reorder_course_sections(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_section_lessons(UUID, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_move_lesson(UUID, UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_lessons(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_lessons(UUID[]) TO authenticated;

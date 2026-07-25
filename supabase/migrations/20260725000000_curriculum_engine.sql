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
    v_sec_id UUID;
    v_found_count INTEGER;
BEGIN
    -- Verify Admin Access
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    IF p_course_id IS NULL THEN
        RAISE EXCEPTION 'Invalid course_id provided.';
    END IF;

    IF p_section_ids IS NULL OR array_length(p_section_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Check for duplicates in p_section_ids
    IF (SELECT COUNT(DISTINCT elem) FROM unnest(p_section_ids) AS elem) <> array_length(p_section_ids, 1) THEN
        RAISE EXCEPTION 'Duplicate section IDs are not allowed in reorder array.';
    END IF;

    -- Verify all section IDs belong to p_course_id and are not soft-deleted
    SELECT COUNT(*) INTO v_found_count
    FROM public.course_sections
    WHERE id = ANY(p_section_ids)
      AND course_id = p_course_id
      AND deleted_at IS NULL;

    IF v_found_count <> array_length(p_section_ids, 1) THEN
        RAISE EXCEPTION 'One or more sections do not belong to the specified course or are deleted.';
    END IF;

    -- Sequential reorder starting at 0
    FOR v_idx IN 1..array_length(p_section_ids, 1) LOOP
        v_sec_id := p_section_ids[v_idx];
        UPDATE public.course_sections
        SET order_index = v_idx - 1,
            updated_at = NOW()
        WHERE id = v_sec_id AND course_id = p_course_id;
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
    v_les_id UUID;
    v_found_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    IF p_course_id IS NULL OR p_section_id IS NULL THEN
        RAISE EXCEPTION 'Course ID and Section ID are required.';
    END IF;

    -- Verify section belongs to course
    IF NOT EXISTS (
        SELECT 1 FROM public.course_sections 
        WHERE id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Section does not belong to specified course.';
    END IF;

    IF p_lesson_ids IS NULL OR array_length(p_lesson_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Check duplicates in p_lesson_ids
    IF (SELECT COUNT(DISTINCT elem) FROM unnest(p_lesson_ids) AS elem) <> array_length(p_lesson_ids, 1) THEN
        RAISE EXCEPTION 'Duplicate lesson IDs in reorder array.';
    END IF;

    -- Verify all lessons belong to p_course_id
    SELECT COUNT(*) INTO v_found_count
    FROM public.lessons
    WHERE id = ANY(p_lesson_ids)
      AND course_id = p_course_id
      AND deleted_at IS NULL;

    IF v_found_count <> array_length(p_lesson_ids, 1) THEN
        RAISE EXCEPTION 'One or more lessons do not belong to specified course or are deleted.';
    END IF;

    FOR v_idx IN 1..array_length(p_lesson_ids, 1) LOOP
        v_les_id := p_lesson_ids[v_idx];
        UPDATE public.lessons
        SET order_index = v_idx - 1,
            section_id = p_section_id,
            updated_at = NOW()
        WHERE id = v_les_id AND course_id = p_course_id;
    END LOOP;
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
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    -- Fetch current lesson section & verify course_id
    SELECT section_id INTO v_source_section_id
    FROM public.lessons
    WHERE id = p_lesson_id AND course_id = p_course_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found in specified course.';
    END IF;

    -- Verify destination section belongs to same course
    IF NOT EXISTS (
        SELECT 1 FROM public.course_sections 
        WHERE id = p_destination_section_id AND course_id = p_course_id AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Destination section does not belong to specified course.';
    END IF;

    -- Move lesson to target section
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
        WHERE section_id = p_destination_section_id AND course_id = p_course_id AND deleted_at IS NULL
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
            WHERE section_id = v_source_section_id AND course_id = p_course_id AND deleted_at IS NULL
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
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
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
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    UPDATE public.lessons
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = ANY(p_lesson_ids);
END;
$$;

-- 7. RPC: Soft Delete Section (and optionally its active lessons)
CREATE OR REPLACE FUNCTION public.admin_soft_delete_section(
    p_course_id UUID,
    p_section_id UUID,
    p_move_items_to_section_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    -- Verify section belongs to course
    IF NOT EXISTS (
        SELECT 1 FROM public.course_sections 
        WHERE id = p_section_id AND course_id = p_course_id
    ) THEN
        RAISE EXCEPTION 'Section does not belong to specified course.';
    END IF;

    IF p_move_items_to_section_id IS NOT NULL THEN
        -- Verify target move section belongs to same course
        IF NOT EXISTS (
            SELECT 1 FROM public.course_sections 
            WHERE id = p_move_items_to_section_id AND course_id = p_course_id AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Target section for lesson reassignment does not belong to specified course.';
        END IF;

        UPDATE public.lessons
        SET section_id = p_move_items_to_section_id,
            updated_at = NOW()
        WHERE section_id = p_section_id AND course_id = p_course_id;
    ELSE
        -- Soft delete lessons in this section
        UPDATE public.lessons
        SET deleted_at = NOW(),
            updated_at = NOW()
        WHERE section_id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL;
    END IF;

    -- Soft delete section itself
    UPDATE public.course_sections
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_section_id AND course_id = p_course_id;
END;
$$;

-- 8. RPC: Restore Section
CREATE OR REPLACE FUNCTION public.admin_restore_section(
    p_course_id UUID,
    p_section_id UUID,
    p_restore_lessons BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    UPDATE public.course_sections
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = p_section_id AND course_id = p_course_id;

    IF p_restore_lessons THEN
        UPDATE public.lessons
        SET deleted_at = NULL,
            updated_at = NOW()
        WHERE section_id = p_section_id AND course_id = p_course_id;
    END IF;
END;
$$;

-- Security Hardening: Revoke default PUBLIC permissions & Grant only to authenticated
REVOKE ALL ON FUNCTION public.admin_reorder_course_sections(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reorder_section_lessons(UUID, UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_move_lesson(UUID, UUID, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_soft_delete_lessons(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_restore_lessons(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_soft_delete_section(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_restore_section(UUID, UUID, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_reorder_course_sections(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_section_lessons(UUID, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_move_lesson(UUID, UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_lessons(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_lessons(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_section(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_section(UUID, UUID, BOOLEAN) TO authenticated;

-- 9. RPC: Duplicate Section
CREATE OR REPLACE FUNCTION public.admin_duplicate_section(
    p_course_id UUID,
    p_section_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orig_section RECORD;
    v_new_section_id UUID;
    v_target_order INTEGER;
    v_lesson RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    -- Fetch original section
    SELECT * INTO v_orig_section
    FROM public.course_sections
    WHERE id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Section not found or deleted.';
    END IF;

    v_target_order := v_orig_section.order_index + 1;

    -- Shift order_index of subsequent sections
    UPDATE public.course_sections
    SET order_index = order_index + 1
    WHERE course_id = p_course_id AND order_index >= v_target_order AND deleted_at IS NULL;

    -- Create new duplicate section
    INSERT INTO public.course_sections (
        course_id,
        title,
        description,
        order_index,
        is_published,
        created_at,
        updated_at
    ) VALUES (
        p_course_id,
        v_orig_section.title || ' (نسخة)',
        v_orig_section.description,
        v_target_order,
        v_orig_section.is_published,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_new_section_id;

    -- Duplicate active lessons
    FOR v_lesson IN
        SELECT * FROM public.lessons
        WHERE section_id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL
        ORDER BY order_index ASC
    LOOP
        INSERT INTO public.lessons (
            course_id,
            section_id,
            title,
            description,
            lesson_type,
            content,
            video_url,
            duration,
            estimated_minutes,
            order_index,
            is_published,
            is_preview,
            created_at,
            updated_at
        ) VALUES (
            p_course_id,
            v_new_section_id,
            v_lesson.title,
            v_lesson.description,
            v_lesson.lesson_type,
            v_lesson.content,
            v_lesson.video_url,
            v_lesson.duration,
            v_lesson.estimated_minutes,
            v_lesson.order_index,
            v_lesson.is_published,
            v_lesson.is_preview,
            NOW(),
            NOW()
        );
    END LOOP;

    RETURN v_new_section_id;
END;
$$;

-- 10. RPC: Bulk Move Lessons
CREATE OR REPLACE FUNCTION public.admin_bulk_move_lessons(
    p_course_id UUID,
    p_lesson_ids UUID[],
    p_destination_section_id UUID,
    p_destination_index INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_found_count INTEGER;
    v_idx INTEGER;
    v_les_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied. Admin privileges required.';
        END IF;
    END IF;

    IF p_course_id IS NULL OR p_destination_section_id IS NULL THEN
        RAISE EXCEPTION 'Course ID and Destination Section ID are required.';
    END IF;

    IF p_lesson_ids IS NULL OR array_length(p_lesson_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Check duplicates in p_lesson_ids
    IF (SELECT COUNT(DISTINCT elem) FROM unnest(p_lesson_ids) AS elem) <> array_length(p_lesson_ids, 1) THEN
        RAISE EXCEPTION 'Duplicate lesson IDs in bulk move array.';
    END IF;

    -- Verify destination section belongs to course
    IF NOT EXISTS (
        SELECT 1 FROM public.course_sections 
        WHERE id = p_destination_section_id AND course_id = p_course_id AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Destination section does not belong to specified course.';
    END IF;

    -- Verify all lessons belong to course and are not soft-deleted
    SELECT COUNT(*) INTO v_found_count
    FROM public.lessons
    WHERE id = ANY(p_lesson_ids)
      AND course_id = p_course_id
      AND deleted_at IS NULL;

    IF v_found_count <> array_length(p_lesson_ids, 1) THEN
        RAISE EXCEPTION 'One or more lessons do not belong to specified course or are deleted.';
    END IF;

    -- Move lessons to target section
    UPDATE public.lessons
    SET section_id = p_destination_section_id,
        updated_at = NOW()
    WHERE id = ANY(p_lesson_ids) AND course_id = p_course_id;

    -- Re-index destination section lessons
    FOR v_idx IN 1..array_length(p_lesson_ids, 1) LOOP
        v_les_id := p_lesson_ids[v_idx];
        UPDATE public.lessons
        SET order_index = p_destination_index + v_idx - 1
        WHERE id = v_les_id AND course_id = p_course_id;
    END LOOP;

    -- Normalize order_index in destination section sequentially
    WITH dest_ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC, updated_at DESC) - 1 AS new_order
        FROM public.lessons
        WHERE section_id = p_destination_section_id AND course_id = p_course_id AND deleted_at IS NULL
    )
    UPDATE public.lessons l
    SET order_index = d.new_order
    FROM dest_ordered d
    WHERE l.id = d.id;

    -- Normalize order_index across all sections in course
    WITH all_ordered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY order_index ASC) - 1 AS new_order
        FROM public.lessons
        WHERE course_id = p_course_id AND deleted_at IS NULL
    )
    UPDATE public.lessons l
    SET order_index = a.new_order
    FROM all_ordered a
    WHERE l.id = a.id;
END;
$$;

-- Security Hardening for new RPCs
REVOKE ALL ON FUNCTION public.admin_duplicate_section(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_bulk_move_lessons(UUID, UUID[], UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_duplicate_section(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_move_lessons(UUID, UUID[], UUID, INTEGER) TO authenticated;


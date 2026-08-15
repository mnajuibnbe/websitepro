-- Admin curation: independent "Bestseller" badge (same pattern as is_featured) and an
-- optional admin-authored override for the catalog card's curriculum highlight bullets.
-- When the override is empty/null, get_public_courses_with_stats() keeps deriving
-- highlights from the two most relevant real published video lesson titles.

ALTER TABLE public.courses
  ADD COLUMN is_bestseller BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN curriculum_highlights TEXT[] NULL;

COMMENT ON COLUMN public.courses.is_bestseller IS
  'Admin-curated bestseller badge shown on catalog cards, independent of is_featured.';
COMMENT ON COLUMN public.courses.curriculum_highlights IS
  'Optional admin-authored override for the catalog card checkmark bullets. NULL or empty falls back to the two most relevant published lesson titles.';

DROP FUNCTION public.get_public_courses_with_stats();

CREATE FUNCTION public.get_public_courses_with_stats()
RETURNS TABLE (
  course JSONB,
  lessons_count BIGINT,
  average_rating NUMERIC,
  review_count BIGINT,
  enrolled_student_count BIGINT,
  curriculum_highlights TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    to_jsonb(c) AS course,
    lesson_stats.lessons_count,
    review_stats.average_rating,
    review_stats.review_count,
    enrollment_stats.enrolled_student_count,
    CASE
      WHEN c.curriculum_highlights IS NOT NULL AND array_length(c.curriculum_highlights, 1) > 0
        THEN c.curriculum_highlights
      ELSE lesson_stats.derived_curriculum_highlights
    END AS curriculum_highlights
  FROM public.courses AS c
  CROSS JOIN LATERAL (
    SELECT
      count(*) AS lessons_count,
      COALESCE((
        SELECT array_agg(ordered_lessons.title ORDER BY ordered_lessons.section_order, ordered_lessons.lesson_order, ordered_lessons.id)
        FROM (
          SELECT l2.id, l2.title, COALESCE(s2.order_index, 2147483647) AS section_order, l2.order_index AS lesson_order
          FROM public.lessons AS l2
          LEFT JOIN public.course_sections AS s2
            ON s2.id = l2.section_id AND s2.course_id = l2.course_id
          WHERE l2.course_id = c.id
            AND l2.is_published = TRUE
            AND l2.deleted_at IS NULL
            AND lower(COALESCE(l2.content_type, l2.lesson_type, '')) = 'video'
            AND btrim(l2.title) <> ''
            AND l2.title !~* '^\s*(lecture\s*\d+\s*:\s*)?introduction\s*$'
            AND l2.title NOT ILIKE '%pdf%'
          ORDER BY COALESCE(s2.order_index, 2147483647), l2.order_index, l2.id
          LIMIT 2
        ) AS ordered_lessons
      ), ARRAY[]::TEXT[]) AS derived_curriculum_highlights
    FROM public.lessons AS l
    WHERE l.course_id = c.id
      AND l.is_published = TRUE
      AND l.deleted_at IS NULL
  ) AS lesson_stats
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(round(avg(r.rating)::NUMERIC, 2), 0::NUMERIC) AS average_rating,
      count(*) AS review_count
    FROM public.course_reviews AS r
    WHERE r.course_id = c.id AND r.status = 'approved'
  ) AS review_stats
  CROSS JOIN LATERAL (
    SELECT count(DISTINCT e.user_id) AS enrolled_student_count
    FROM public.enrollments AS e
    WHERE e.course_id = c.id AND e.status = 'active'
  ) AS enrollment_stats
  WHERE c.status = 'published'
    AND COALESCE(c.visibility, 'public') = 'public'
  ORDER BY c.home_order ASC NULLS LAST, c.published_at DESC NULLS LAST, c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_public_courses_with_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_courses_with_stats() TO anon, authenticated;
COMMENT ON FUNCTION public.get_public_courses_with_stats() IS
  'Returns public courses with lesson counts, an admin-override or lesson-derived curriculum highlight, and privacy-safe review/enrollment aggregates.';

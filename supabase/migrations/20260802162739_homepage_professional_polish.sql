CREATE TABLE public.homepage_marketing_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  students_value TEXT NOT NULL CHECK (students_value ~ '^[0-9][0-9,]*\+?$' AND char_length(students_value) <= 12),
  courses_value TEXT NOT NULL CHECK (courses_value ~ '^[0-9][0-9,]*\+?$' AND char_length(courses_value) <= 12),
  learning_hours_value TEXT NOT NULL CHECK (learning_hours_value ~ '^[0-9][0-9,]*\+?$' AND char_length(learning_hours_value) <= 12),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.homepage_marketing_settings IS
  'Admin-managed historical marketing totals shown on the public homepage. These values are intentionally not live database counts.';

ALTER TABLE public.homepage_marketing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view homepage marketing settings"
  ON public.homepage_marketing_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update homepage marketing settings"
  ON public.homepage_marketing_settings
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

REVOKE ALL ON TABLE public.homepage_marketing_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_marketing_settings TO anon, authenticated;
GRANT UPDATE (students_value, courses_value, learning_hours_value, updated_at, updated_by)
  ON TABLE public.homepage_marketing_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_marketing_settings TO service_role;

INSERT INTO public.homepage_marketing_settings (
  id,
  students_value,
  courses_value,
  learning_hours_value
)
VALUES (1, '1,000+', '8+', '200+');

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
    lesson_stats.curriculum_highlights
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
            AND btrim(l2.title) <> ''
          ORDER BY COALESCE(s2.order_index, 2147483647), l2.order_index, l2.id
          LIMIT 2
        ) AS ordered_lessons
      ), ARRAY[]::TEXT[]) AS curriculum_highlights
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
  'Returns public courses with counts for every published, non-deleted lesson plus two real curriculum lesson titles and privacy-safe review/enrollment aggregates.';

CREATE FUNCTION public.get_homepage_preview_lessons()
RETURNS TABLE (
  lesson_id UUID,
  lesson_title TEXT,
  course_id UUID,
  course_title TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT l.id, l.title, c.id, c.title
  FROM public.lessons AS l
  JOIN public.courses AS c ON c.id = l.course_id
  JOIN public.course_sections AS s
    ON s.id = l.section_id AND s.course_id = l.course_id
  WHERE l.is_preview = TRUE
    AND l.is_published = TRUE
    AND l.deleted_at IS NULL
    AND l.video_url IS NOT NULL
    AND btrim(l.video_url) <> ''
    AND c.status = 'published'
    AND COALESCE(c.visibility, 'public') = 'public'
    AND s.is_published = TRUE
    AND s.deleted_at IS NULL
  ORDER BY c.home_order ASC NULLS LAST, s.order_index, l.order_index, l.id;
$$;

REVOKE ALL ON FUNCTION public.get_homepage_preview_lessons() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_homepage_preview_lessons() TO anon, authenticated;
COMMENT ON FUNCTION public.get_homepage_preview_lessons() IS
  'Returns safe identifying metadata for published public video lessons selected by admins through lessons.is_preview.';

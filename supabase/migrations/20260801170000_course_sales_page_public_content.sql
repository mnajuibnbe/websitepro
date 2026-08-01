-- Public course sales-page projections for approved learner reviews and free previews.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_course_curriculum(p_course_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(jsonb_agg(section_payload ORDER BY section_order), '[]'::jsonb)
  FROM (
    SELECT s.order_index AS section_order, jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'description', s.description,
      'order_index', s.order_index,
      'lesson_count', count(l.id),
      'total_minutes', COALESCE(sum(CASE WHEN l.content_type = 'video' THEN l.estimated_minutes ELSE 0 END), 0),
      'lessons', COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'content_type', COALESCE(l.content_type, CASE WHEN l.type = 'quiz' THEN 'quiz' WHEN l.type = 'text' THEN 'pdf' ELSE 'video' END),
        'estimated_minutes', l.estimated_minutes,
        'is_preview', l.is_preview,
        'video_url', CASE
          WHEN l.is_preview IS TRUE
            AND COALESCE(l.content_type, CASE WHEN l.type = 'quiz' THEN 'quiz' WHEN l.type = 'text' THEN 'pdf' ELSE 'video' END) = 'video'
          THEN l.video_url
          ELSE NULL
        END,
        'video_provider', CASE
          WHEN l.is_preview IS TRUE
            AND COALESCE(l.content_type, CASE WHEN l.type = 'quiz' THEN 'quiz' WHEN l.type = 'text' THEN 'pdf' ELSE 'video' END) = 'video'
          THEN l.video_provider
          ELSE NULL
        END,
        'order_index', l.order_index
      ) ORDER BY l.order_index) FILTER (WHERE l.id IS NOT NULL), '[]'::jsonb)
    ) AS section_payload
    FROM public.course_sections AS s
    JOIN public.courses AS c ON c.id = s.course_id
    LEFT JOIN public.lessons AS l ON l.section_id = s.id
      AND l.course_id = c.id AND l.is_published = TRUE AND l.deleted_at IS NULL
    WHERE c.id = p_course_id AND c.status = 'published'
      AND COALESCE(c.visibility, 'public') = 'public'
      AND s.is_published = TRUE AND s.deleted_at IS NULL
    GROUP BY s.id, s.title, s.description, s.order_index
  ) AS public_sections;
$$;

REVOKE ALL ON FUNCTION public.get_public_course_curriculum(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_course_curriculum(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_course_reviews(
  p_course_id UUID,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  review_id UUID,
  reviewer_name TEXT,
  rating SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    review.id,
    COALESCE(NULLIF(btrim(app_user.full_name), ''), 'Learner') AS reviewer_name,
    review.rating,
    review.comment,
    review.created_at
  FROM public.course_reviews AS review
  JOIN public.courses AS course ON course.id = review.course_id
  LEFT JOIN public.users AS app_user ON app_user.id = review.user_id
  WHERE review.course_id = p_course_id
    AND review.status = 'approved'
    AND course.status = 'published'
    AND COALESCE(course.visibility, 'public') = 'public'
  ORDER BY review.created_at DESC, review.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) TO anon, authenticated;
COMMENT ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) IS
  'Returns a bounded feed of approved learner reviews for a published public course.';

NOTIFY pgrst, 'reload schema';
COMMIT;

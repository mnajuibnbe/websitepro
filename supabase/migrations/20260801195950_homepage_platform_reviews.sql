-- Allow the existing public review projection to serve both course pages and
-- the homepage without exposing moderation fields or direct table access.
CREATE OR REPLACE FUNCTION public.get_public_course_reviews(
  p_course_id UUID DEFAULT NULL,
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
SECURITY INVOKER
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
  WHERE (p_course_id IS NULL OR review.course_id = p_course_id)
    AND review.status = 'approved'
    AND course.status = 'published'
    AND COALESCE(course.visibility, 'public') = 'public'
  ORDER BY
    CASE WHEN p_course_id IS NULL THEN review.rating END DESC,
    review.created_at DESC,
    review.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) TO anon, authenticated;
COMMENT ON FUNCTION public.get_public_course_reviews(UUID, INTEGER) IS
  'Returns a bounded feed of approved learner reviews for one published public course, or the highest-rated reviews platform-wide when p_course_id is NULL.';

CREATE INDEX IF NOT EXISTS course_reviews_approved_rating_created_idx
  ON public.course_reviews (rating DESC, created_at DESC, id DESC)
  WHERE status = 'approved';

NOTIFY pgrst, 'reload schema';

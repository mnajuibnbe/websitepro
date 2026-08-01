-- Admin moderation for learner-authored course reviews.
BEGIN;

ALTER TABLE public.course_reviews
  ADD COLUMN moderation_note TEXT NULL,
  ADD COLUMN reviewed_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at TIMESTAMPTZ NULL;

ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_moderation_note_length
    CHECK (moderation_note IS NULL OR char_length(moderation_note) <= 2000),
  ADD CONSTRAINT course_reviews_moderation_state
    CHECK (
      (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
      OR (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    );

CREATE INDEX course_reviews_pending_course_created_idx
  ON public.course_reviews(course_id, created_at DESC)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.admin_list_pending_course_reviews(p_course_id UUID DEFAULT NULL)
RETURNS TABLE (
  review_id UUID,
  course_id UUID,
  course_title TEXT,
  reviewer_name TEXT,
  reviewer_email TEXT,
  rating SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    review.id,
    review.course_id,
    course.title,
    COALESCE(app_user.full_name, 'Learner'),
    COALESCE(app_user.email, ''),
    review.rating,
    review.comment,
    review.created_at
  FROM public.course_reviews AS review
  JOIN public.courses AS course ON course.id = review.course_id
  LEFT JOIN public.users AS app_user ON app_user.id = review.user_id
  WHERE review.status = 'pending'
    AND (p_course_id IS NULL OR review.course_id = p_course_id)
  ORDER BY review.created_at ASC, review.id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_course_review(
  p_review_id UUID,
  p_decision TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Decision must be approved or rejected';
  END IF;
  IF char_length(COALESCE(p_note, '')) > 2000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Moderation note must be 2000 characters or fewer';
  END IF;

  UPDATE public.course_reviews
  SET status = p_decision,
      moderation_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = now()
  WHERE id = p_review_id AND status = 'pending'
  RETURNING status INTO v_status;

  IF v_status IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'This review is no longer pending';
  END IF;
  RETURN v_status;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_pending_course_reviews(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_moderate_course_review(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_course_reviews(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_moderate_course_review(UUID, TEXT, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_list_pending_course_reviews(UUID) IS
  'Lists pending learner-authored course reviews for administrators, optionally filtered by course.';
COMMENT ON FUNCTION public.admin_moderate_course_review(UUID, TEXT, TEXT) IS
  'Atomically approves or rejects one pending learner review and records the administrator and optional note.';

NOTIFY pgrst, 'reload schema';
COMMIT;

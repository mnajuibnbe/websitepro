-- Database & Content Model Foundation
-- Ordered course-detail copy is stored as JSONB text arrays. These items are
-- value objects: they need stable array ordering, but no independent identity,
-- icon, permissions, or lifecycle. A CHECK-backed JSONB array keeps that shape
-- explicit without introducing three otherwise identical child tables.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_nonempty_jsonb_text_array(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_typeof(value) = 'array'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(value) AS item
      WHERE jsonb_typeof(item) <> 'string' OR btrim(item #>> '{}') = ''
    );
$$;

REVOKE ALL ON FUNCTION public.is_nonempty_jsonb_text_array(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_nonempty_jsonb_text_array(JSONB) TO authenticated, service_role;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS learning_outcomes JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS target_audience JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_learning_outcomes_text_array;
ALTER TABLE public.courses ADD CONSTRAINT courses_learning_outcomes_text_array
  CHECK (public.is_nonempty_jsonb_text_array(learning_outcomes));
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_requirements_text_array;
ALTER TABLE public.courses ADD CONSTRAINT courses_requirements_text_array
  CHECK (public.is_nonempty_jsonb_text_array(requirements));
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_target_audience_text_array;
ALTER TABLE public.courses ADD CONSTRAINT courses_target_audience_text_array
  CHECK (public.is_nonempty_jsonb_text_array(target_audience));

COMMENT ON COLUMN public.courses.learning_outcomes IS 'Ordered JSON array of non-empty display strings.';
COMMENT ON COLUMN public.courses.requirements IS 'Ordered JSON array of non-empty display strings.';
COMMENT ON COLUMN public.courses.target_audience IS 'Ordered JSON array of non-empty display strings.';

-- The taxonomy table was introduced in 20260728020000. This migration turns it
-- into referential integrity and records every legacy value that cannot be
-- mapped safely, rather than silently promoting a possible typo to a category.
CREATE TABLE IF NOT EXISTS public.course_category_migration_issues (
  course_id UUID PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  original_category TEXT NOT NULL,
  normalized_candidate TEXT NULL,
  reason TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_category_migration_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view category migration issues" ON public.course_category_migration_issues;
CREATE POLICY "Admins can view category migration issues"
  ON public.course_category_migration_issues FOR SELECT TO authenticated
  USING (public.is_admin());

-- Known historical spellings, filter labels, and Arabic labels are normalized.
UPDATE public.courses
SET category = CASE lower(btrim(category))
  WHEN 'skin care' THEN 'Skin Care'
  WHEN 'skincare' THEN 'Skin Care'
  WHEN 'skin-care' THEN 'Skin Care'
  WHEN 'skin care courses' THEN 'Skin Care'
  WHEN 'البشرة' THEN 'Skin Care'
  WHEN 'العناية بالبشرة' THEN 'Skin Care'
  WHEN 'hair care' THEN 'Hair Care'
  WHEN 'haircare' THEN 'Hair Care'
  WHEN 'hair-care' THEN 'Hair Care'
  WHEN 'hair care courses' THEN 'Hair Care'
  WHEN 'الشعر' THEN 'Hair Care'
  WHEN 'العناية بالشعر' THEN 'Hair Care'
  WHEN 'professional practice' THEN 'Professional Practice'
  WHEN 'professional practices' THEN 'Professional Practice'
  WHEN 'professional-practice' THEN 'Professional Practice'
  WHEN 'cosmetic science' THEN 'Cosmetic Science'
  WHEN 'cosmetics science' THEN 'Cosmetic Science'
  WHEN 'cosmetic-science' THEN 'Cosmetic Science'
  ELSE category
END
WHERE lower(btrim(category)) IN (
  'skin care', 'skincare', 'skin-care', 'skin care courses',
  'البشرة', 'العناية بالبشرة',
  'hair care', 'haircare', 'hair-care', 'hair care courses',
  'الشعر', 'العناية بالشعر',
  'professional practice', 'professional practices', 'professional-practice',
  'cosmetic science', 'cosmetics science', 'cosmetic-science'
);

-- Blank legacy values are semantically uncategorized, not migration failures.
UPDATE public.courses SET category = NULL
WHERE category IS NOT NULL AND btrim(category) = '';

INSERT INTO public.course_category_migration_issues (
  course_id, original_category, normalized_candidate, reason
)
SELECT c.id, c.category, lower(btrim(c.category)),
  'No unambiguous canonical course_categories.value mapping'
FROM public.courses AS c
WHERE c.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.course_categories AS cc WHERE cc.value = c.category
  )
ON CONFLICT (course_id) DO UPDATE SET
  original_category = EXCLUDED.original_category,
  normalized_candidate = EXCLUDED.normalized_candidate,
  reason = EXCLUDED.reason,
  detected_at = now();

-- Preserve the original value in the issue table and make the live row
-- explicitly uncategorized so the foreign key can be installed atomically.
UPDATE public.courses AS c
SET category = NULL
WHERE c.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.course_categories AS cc WHERE cc.value = c.category
  );

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_category_fkey;
ALTER TABLE public.courses ADD CONSTRAINT courses_category_fkey
  FOREIGN KEY (category) REFERENCES public.course_categories(value)
  ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS courses_category_idx ON public.courses(category)
  WHERE category IS NOT NULL;

COMMENT ON TABLE public.course_category_migration_issues IS
  'Audit report for legacy course category values that could not be mapped safely. Resolve rows administratively, then delete the resolved audit record.';

CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(btrim(comment)) BETWEEN 1 AND 5000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_reviews_course_user_key UNIQUE (course_id, user_id)
);

CREATE INDEX course_reviews_approved_course_created_idx
  ON public.course_reviews(course_id, created_at DESC) WHERE status = 'approved';
CREATE INDEX course_reviews_user_created_idx
  ON public.course_reviews(user_id, created_at DESC);
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can view approved course reviews"
  ON public.course_reviews FOR SELECT TO anon
  USING (status = 'approved');
CREATE POLICY "Authenticated users can view permitted course reviews"
  ON public.course_reviews FOR SELECT TO authenticated
  USING (status = 'approved' OR public.is_admin());
CREATE POLICY "Active students can submit own course review"
  ON public.course_reviews FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
    AND public.has_active_enrollment(course_id)
  );
CREATE POLICY "Admins can moderate course reviews"
  ON public.course_reviews FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS enrollments_active_course_user_idx
  ON public.enrollments(course_id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS lessons_published_course_idx
  ON public.lessons(course_id) WHERE is_published = TRUE AND deleted_at IS NULL;

-- SECURITY DEFINER is required because public callers must receive aggregate
-- counts without receiving direct SELECT access to enrollment or lesson rows.
-- The fixed public-only predicate deliberately mirrors the catalogue policy in
-- 20260726000000_course_visibility_rls.sql.
CREATE OR REPLACE FUNCTION public.get_public_courses_with_stats()
RETURNS TABLE (
  course JSONB,
  lessons_count BIGINT,
  average_rating NUMERIC,
  review_count BIGINT,
  enrolled_student_count BIGINT
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
    enrollment_stats.enrolled_student_count
  FROM public.courses AS c
  CROSS JOIN LATERAL (
    SELECT count(*) AS lessons_count
    FROM public.lessons AS l
    JOIN public.course_sections AS s
      ON s.id = l.section_id AND s.course_id = l.course_id
    WHERE l.course_id = c.id AND l.is_published = TRUE AND l.deleted_at IS NULL
      AND s.is_published = TRUE AND s.deleted_at IS NULL
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
  'Returns only published public-catalogue courses and privacy-safe aggregate lesson, approved-review, and active-enrollment statistics.';

CREATE TABLE public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.course_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'instapay', 'vodafone_cash')),
  reference_note TEXT NULL CHECK (reference_note IS NULL OR char_length(reference_note) <= 1000),
  proof_image_url TEXT NOT NULL CHECK (btrim(proof_image_url) <> ''),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT payment_submissions_review_state_check CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
    OR (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX payment_submissions_status_submitted_idx
  ON public.payment_submissions(status, submitted_at DESC);
CREATE INDEX payment_submissions_order_submitted_idx
  ON public.payment_submissions(order_id, submitted_at DESC);
CREATE INDEX payment_submissions_reviewer_idx
  ON public.payment_submissions(reviewed_by) WHERE reviewed_by IS NOT NULL;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can submit payment proof for own orders"
  ON public.payment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.course_orders AS o
      WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Authenticated users can view permitted payment submissions"
  ON public.payment_submissions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_orders AS o
      WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Admins can review payment submissions"
  ON public.payment_submissions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs', 'payment-proofs', FALSE, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Object names must begin with the authenticated user's UUID:
-- <user-id>/<generated-file-name>.<extension>.
CREATE POLICY "Authenticated users can upload permitted payment proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (public.is_admin() OR (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
  );
CREATE POLICY "Authenticated users can view permitted payment proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (public.is_admin() OR (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
  );
CREATE POLICY "Authenticated users can update permitted payment proofs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (public.is_admin() OR (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
  )
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (public.is_admin() OR (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
  );
CREATE POLICY "Authenticated users can delete permitted payment proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (public.is_admin() OR (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
  );

NOTIFY pgrst, 'reload schema';

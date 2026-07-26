-- COURSE-VISIBILITY-FIX-001
-- Before: the repository did not define courses/enrollments SELECT policies, so
-- deployed behavior depended on untracked dashboard configuration.
-- After: public users can read published public catalogue records; authenticated
-- users can read only their own enrollments. Existing admin policies remain intact.

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses"
  ON public.courses FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND COALESCE(visibility, 'public') = 'public'
  );

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY "Public can view published courses" ON public.courses IS
  'Catalogue access only: excludes drafts, archived courses, private courses and unlisted courses.';
COMMENT ON POLICY "Students can view own enrollments" ON public.enrollments IS
  'Allows a signed-in student to read enrollment state only for their auth.users id.';

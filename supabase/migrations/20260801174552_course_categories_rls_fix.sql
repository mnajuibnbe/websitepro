-- Keep the public active-category read independent from the authenticated
-- admin helper so anonymous catalog requests never invoke admin-only code.
BEGIN;

DROP POLICY IF EXISTS "Anyone can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins can view all course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Anonymous users can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Authenticated users can view permitted course categories" ON public.course_categories;

CREATE POLICY "Anonymous users can view active course categories"
  ON public.course_categories FOR SELECT TO anon
  USING (is_active);

CREATE POLICY "Authenticated users can view permitted course categories"
  ON public.course_categories FOR SELECT TO authenticated
  USING (is_active OR (SELECT public.is_admin()));

NOTIFY pgrst, 'reload schema';
COMMIT;

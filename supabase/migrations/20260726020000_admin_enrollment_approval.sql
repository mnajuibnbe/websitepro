-- COURSE-VISIBILITY-FIX-001 follow-up: allow the existing Admin approval action.
-- This deliberately permits only pending -> active transitions. It does not give
-- students UPDATE access and does not permit arbitrary enrollment status edits.

DROP POLICY IF EXISTS "Admins can approve pending enrollments" ON public.enrollments;
CREATE POLICY "Admins can approve pending enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status = 'pending'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status = 'active'
  );

COMMENT ON POLICY "Admins can approve pending enrollments" ON public.enrollments IS
  'Allows authenticated app_metadata admins to approve pending enrollments only.';

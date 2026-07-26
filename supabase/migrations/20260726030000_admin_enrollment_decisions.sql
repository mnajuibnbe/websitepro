-- Allow the existing Admin request queue to approve or deny a pending request.
-- `cancelled` is the denial terminal state already supported by the enrollment
-- schema/types. Students receive no UPDATE permission.

DROP POLICY IF EXISTS "Admins can approve pending enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can decide pending enrollments" ON public.enrollments;

CREATE POLICY "Admins can decide pending enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status = 'pending'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status IN ('active', 'cancelled')
  );

COMMENT ON POLICY "Admins can decide pending enrollments" ON public.enrollments IS
  'Allows app_metadata admins to approve (active) or deny (cancelled) pending requests only.';

-- COURSE-VISIBILITY-FIX-001 follow-up
-- Keep the public catalogue policy narrow while allowing an enrolled student to
-- resolve a published course that is intentionally private or unlisted.
-- Lesson access remains protected independently by has_active_enrollment().

DROP POLICY IF EXISTS "Active students can view enrolled published courses" ON public.courses;
CREATE POLICY "Active students can view enrolled published courses"
  ON public.courses FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND public.has_active_enrollment(id)
  );

COMMENT ON POLICY "Active students can view enrolled published courses" ON public.courses IS
  'Permits only published course metadata for a course where auth.uid() has an active enrollment; does not grant lesson access.';

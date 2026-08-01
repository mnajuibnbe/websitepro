-- Approved-review rows and reviewer display names are already protected by RLS.
-- Run the bounded public feed with caller privileges instead of table-owner privileges.
ALTER FUNCTION public.get_public_course_reviews(UUID, INTEGER) SECURITY INVOKER;

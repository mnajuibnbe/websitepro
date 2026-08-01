-- The moderation RPCs can rely on the existing admin RLS policies, so they do
-- not need elevated table-owner privileges. Keep the explicit identity checks
-- in the functions and execute all data access as the authenticated caller.
BEGIN;

ALTER FUNCTION public.admin_list_pending_course_reviews(UUID) SECURITY INVOKER;
ALTER FUNCTION public.admin_moderate_course_review(UUID, TEXT, TEXT) SECURITY INVOKER;

COMMIT;

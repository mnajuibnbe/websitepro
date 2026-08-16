-- get_advisors flagged cleanup_replaced_blog_cover() as directly callable by anon/authenticated
-- via PostgREST's /rest/v1/rpc/ endpoint (SECURITY DEFINER functions in the public schema are
-- exposed there by default; this project also grants EXECUTE to those roles at function-creation
-- time, so "REVOKE ... FROM PUBLIC" alone -- which is what the pre-existing
-- cleanup_replaced_course_cover() relies on -- was not enough here). It should only ever run as
-- an AFTER trigger, never as a direct RPC call.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.cleanup_replaced_blog_cover() FROM anon, authenticated;
COMMIT;

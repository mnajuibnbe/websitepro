BEGIN;

-- This is a trigger function (RETURNS TRIGGER) with no legitimate direct-RPC use.
-- Lock it to postgres/service_role only, matching cleanup_replaced_blog_cover
-- (its blog-covers precedent) exactly.
REVOKE ALL ON FUNCTION public.cleanup_replaced_instructor_photo() FROM authenticated;

COMMIT;

BEGIN;

-- The initial grant only revoked from PUBLIC; this project's default privileges grant
-- EXECUTE to anon on new functions independently of the PUBLIC pseudo-role, so anon
-- could still call this admin-only RPC (harmlessly, since is_admin() rejects it, but
-- inconsistent with every other admin RPC in this codebase, which revokes from anon
-- explicitly, e.g. admin_moderate_course_review).
REVOKE ALL ON FUNCTION public.admin_move_legacy_testimonial(BIGINT, TEXT) FROM anon;

COMMIT;

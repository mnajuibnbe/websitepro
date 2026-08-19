BEGIN;

-- REVOKE ALL ... FROM PUBLIC in the defining migration didn't strip the default-privilege
-- grant this project applies to new functions for anon specifically (same gap fixed for
-- admin_move_legacy_testimonial).
REVOKE ALL ON FUNCTION public.cleanup_replaced_instructor_photo() FROM anon;

COMMIT;

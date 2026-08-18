-- Adds admin delete for contact_submissions. The inbox was intentionally
-- read/reply/resolve-only up to this point; this closes that gap so admins
-- can remove spam/junk submissions. Deleting a contact_submissions row
-- cascades to its contact_submission_replies via the existing
-- ON DELETE CASCADE FK (contact_submission_replies_submission_id_fkey).
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_contact_submission(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  DELETE FROM public.contact_submissions WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_contact_submission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_contact_submission(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Flagged by the performance advisor after the two-way threading migration:
-- admin_id's FK had no covering index. Partial (admin_id is NULL for
-- visitor rows, which are the ones expected to grow fastest).
CREATE INDEX contact_submission_replies_admin_id_idx
  ON public.contact_submission_replies (admin_id)
  WHERE admin_id IS NOT NULL;

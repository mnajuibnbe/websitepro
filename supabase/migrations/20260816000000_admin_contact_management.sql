-- Admin inbox for contact_submissions: read/reply tracking plus the reply
-- thread itself. Sending the actual reply email requires an outbound HTTP
-- call (Resend), which this project has no Postgres extension for (pg_net
-- is not installed) -- that step stays in Express (POST /api/contact/:id/reply),
-- matching how the existing instructor-invite email already works. These
-- RPCs only cover the read-only/administrative parts: listing, viewing the
-- reply thread, and marking a submission read. All are gated by
-- public.is_admin(), mirroring admin_list_pending_payment_submissions.
BEGIN;

ALTER TABLE public.contact_submissions
  ADD COLUMN read_at TIMESTAMPTZ NULL,
  ADD COLUMN replied_at TIMESTAMPTZ NULL;

CREATE TABLE public.contact_submission_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.users(id),
  message_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_status TEXT NOT NULL DEFAULT 'sent',
  email_error TEXT NULL,
  CONSTRAINT contact_submission_replies_message_length
    CHECK (char_length(btrim(message_html)) BETWEEN 1 AND 10000),
  CONSTRAINT contact_submission_replies_email_status
    CHECK (email_status IN ('sent', 'failed'))
);

COMMENT ON TABLE public.contact_submission_replies IS
  'Admin replies sent to contact_submissions visitors by email. Written only by the server (service role) via POST /api/contact/:id/reply -- no client-side inserts, matching contact_submissions itself.';

CREATE INDEX contact_submission_replies_submission_id_idx
  ON public.contact_submission_replies (submission_id, created_at);

ALTER TABLE public.contact_submission_replies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contact_submission_replies FROM anon, authenticated;
GRANT ALL ON TABLE public.contact_submission_replies TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_contact_submissions()
RETURNS TABLE (
  id UUID, name TEXT, email TEXT, phone TEXT, topic TEXT, message TEXT,
  status TEXT, created_at TIMESTAMPTZ, read_at TIMESTAMPTZ, replied_at TIMESTAMPTZ,
  reply_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.id, cs.name, cs.email, cs.phone, cs.topic, cs.message, cs.status,
    cs.created_at, cs.read_at, cs.replied_at, COUNT(r.id)
  FROM public.contact_submissions cs
  LEFT JOIN public.contact_submission_replies r ON r.submission_id = cs.id
  WHERE public.is_admin()
  GROUP BY cs.id
  ORDER BY cs.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_contact_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_contact_submissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_count_unread_contact_submissions()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.is_admin()
    THEN (SELECT COUNT(*) FROM public.contact_submissions WHERE read_at IS NULL)
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.admin_count_unread_contact_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_count_unread_contact_submissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_contact_submission_replies(p_submission_id UUID)
RETURNS TABLE (
  id UUID, admin_id UUID, admin_name TEXT, message_html TEXT,
  created_at TIMESTAMPTZ, email_status TEXT, email_error TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.admin_id, COALESCE(u.full_name, 'Admin'), r.message_html, r.created_at, r.email_status, r.email_error
  FROM public.contact_submission_replies r
  LEFT JOIN public.users u ON u.id = r.admin_id
  WHERE public.is_admin() AND r.submission_id = p_submission_id
  ORDER BY r.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_contact_submission_replies(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_contact_submission_replies(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_contact_submission_read(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  UPDATE public.contact_submissions SET read_at = now() WHERE id = p_id AND read_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_contact_submission_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_contact_submission_read(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Two-way threading for contact_submission_replies: visitor replies received
-- via the Resend Inbound webhook (POST /api/webhooks/resend-inbound) now
-- join the same thread as admin replies. admin_id becomes nullable and a
-- sender_type discriminator distinguishes the two. Visitor rows carry the
-- inbound email's Resend id (resend_email_id) so the webhook handler can
-- upsert with ignoreDuplicates and stay idempotent across retried/duplicate
-- webhook deliveries. Visitor content is stored and rendered as plain text
-- (is_html = false) -- never as raw HTML -- because an inbound email body is
-- attacker-controlled and this project has no server-side HTML sanitizer;
-- rendering it as escaped text with white-space: pre-wrap (matching how
-- contact_submissions.message already renders) removes the stored-XSS
-- surface entirely instead of trying to sanitize it away.
BEGIN;

ALTER TABLE public.contact_submissions
  ADD COLUMN resolved_at TIMESTAMPTZ NULL;

ALTER TABLE public.contact_submission_replies
  ALTER COLUMN admin_id DROP NOT NULL,
  ALTER COLUMN email_status DROP NOT NULL,
  ALTER COLUMN email_status DROP DEFAULT,
  ADD COLUMN sender_type TEXT NOT NULL DEFAULT 'admin',
  ADD COLUMN visitor_email TEXT NULL,
  ADD COLUMN is_html BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN resend_email_id TEXT NULL,
  ADD COLUMN attachment_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.contact_submission_replies
  DROP CONSTRAINT contact_submission_replies_message_length,
  ADD CONSTRAINT contact_submission_replies_message_length
    CHECK (char_length(btrim(message_html)) BETWEEN 1 AND 20000),
  DROP CONSTRAINT contact_submission_replies_email_status,
  ADD CONSTRAINT contact_submission_replies_email_status
    CHECK (email_status IS NULL OR email_status IN ('sent', 'failed')),
  ADD CONSTRAINT contact_submission_replies_sender_type
    CHECK (sender_type IN ('admin', 'visitor')),
  ADD CONSTRAINT contact_submission_replies_attachment_count
    CHECK (attachment_count >= 0),
  ADD CONSTRAINT contact_submission_replies_visitor_email_format
    CHECK (visitor_email IS NULL OR visitor_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  -- Keeps admin/visitor fields internally consistent: an admin row always
  -- has admin_id and no visitor fields; a visitor row always has the
  -- opposite plus the Resend id the webhook dedupes on.
  ADD CONSTRAINT contact_submission_replies_sender_consistency
    CHECK (
      (sender_type = 'admin' AND admin_id IS NOT NULL AND visitor_email IS NULL AND resend_email_id IS NULL)
      OR
      (sender_type = 'visitor' AND admin_id IS NULL AND visitor_email IS NOT NULL AND resend_email_id IS NOT NULL)
    );

-- Idempotency key for the webhook handler's upsert(..., { onConflict: 'resend_email_id', ignoreDuplicates: true }).
CREATE UNIQUE INDEX contact_submission_replies_resend_email_id_idx
  ON public.contact_submission_replies (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

COMMENT ON TABLE public.contact_submission_replies IS
  'Two-way thread on a contact_submissions row: admin replies sent by email (sender_type=admin, written by POST /api/contact/:id/reply) and visitor replies received by email (sender_type=visitor, written by POST /api/webhooks/resend-inbound). No client-side inserts -- both routes use the service role.';

DROP FUNCTION IF EXISTS public.admin_list_contact_submissions();

CREATE FUNCTION public.admin_list_contact_submissions()
RETURNS TABLE (
  id UUID, name TEXT, email TEXT, phone TEXT, topic TEXT, message TEXT,
  status TEXT, created_at TIMESTAMPTZ, read_at TIMESTAMPTZ, replied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ, reply_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.id, cs.name, cs.email, cs.phone, cs.topic, cs.message, cs.status,
    cs.created_at, cs.read_at, cs.replied_at, cs.resolved_at, COUNT(r.id)
  FROM public.contact_submissions cs
  LEFT JOIN public.contact_submission_replies r ON r.submission_id = cs.id
  WHERE public.is_admin()
  GROUP BY cs.id
  ORDER BY cs.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_contact_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_contact_submissions() TO authenticated;

-- Thread is capped at the 500 most recent messages -- plenty for a support
-- inbox and cheap to render; a genuinely unbounded thread (pagination /
-- infinite scroll) is a separate follow-up if usage ever approaches that.
DROP FUNCTION IF EXISTS public.admin_list_contact_submission_replies(UUID);

CREATE FUNCTION public.admin_list_contact_submission_replies(p_submission_id UUID)
RETURNS TABLE (
  id UUID, sender_type TEXT, admin_id UUID, admin_name TEXT, visitor_email TEXT,
  message_html TEXT, is_html BOOLEAN, attachment_count INTEGER,
  created_at TIMESTAMPTZ, email_status TEXT, email_error TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.sender_type, r.admin_id, COALESCE(u.full_name, 'Admin'), r.visitor_email,
         r.message_html, r.is_html, r.attachment_count, r.created_at, r.email_status, r.email_error
  FROM public.contact_submission_replies r
  LEFT JOIN public.users u ON u.id = r.admin_id
  WHERE public.is_admin() AND r.submission_id = p_submission_id
  ORDER BY r.created_at ASC
  LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.admin_list_contact_submission_replies(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_contact_submission_replies(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_contact_submission_resolved(p_id UUID, p_resolved BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;
  UPDATE public.contact_submissions
  SET resolved_at = CASE WHEN p_resolved THEN now() ELSE NULL END
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_contact_submission_resolved(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_contact_submission_resolved(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Fixes a defect that has silently dropped every inbound visitor reply
-- since two-way threading shipped: the inbound webhook handler
-- (contact-inbound.routes.ts) upserts with
-- .upsert(row, { onConflict: 'resend_email_id', ignoreDuplicates: true }),
-- which PostgREST/Postgres compiles to
-- INSERT ... ON CONFLICT (resend_email_id) DO NOTHING. Postgres can only
-- use that target if a unique index exists with an EXACT match, including
-- any partial predicate -- but the index created in
-- 20260816130000_contact_two_way_threading.sql is PARTIAL
-- (WHERE resend_email_id IS NOT NULL), which the plain
-- ON CONFLICT (resend_email_id) clause the app actually sends does not
-- match. Every real delivery therefore failed at the DB layer with
-- 42P10 "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification", which the handler correctly reports as a 500 --
-- reproduced directly: `select ... on conflict (resend_email_id) do
-- nothing` against production throws exactly this error.
--
-- The partial predicate was unnecessary in the first place: a normal
-- (non-partial) unique index already permits unlimited NULLs in Postgres
-- (NULL is never considered equal to another NULL for uniqueness), which
-- is exactly what admin-sent replies need (they always have
-- resend_email_id = NULL). Replacing the partial index with a plain one
-- keeps that behavior for admin rows while making the ON CONFLICT target
-- resolvable for visitor rows, which is the only thing that needed fixing.
BEGIN;

DROP INDEX IF EXISTS public.contact_submission_replies_resend_email_id_idx;

CREATE UNIQUE INDEX contact_submission_replies_resend_email_id_idx
  ON public.contact_submission_replies (resend_email_id);

NOTIFY pgrst, 'reload schema';
COMMIT;

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  topic text not null default 'other',
  message text not null,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  constraint contact_submissions_name_length
    check (char_length(btrim(name)) between 1 and 200),
  constraint contact_submissions_email_normalized
    check (email = lower(btrim(email)) and char_length(email) between 3 and 320),
  constraint contact_submissions_email_format
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint contact_submissions_phone_length
    check (phone is null or char_length(phone) <= 40),
  constraint contact_submissions_topic
    check (topic in ('support', 'billing', 'course', 'other')),
  constraint contact_submissions_message_length
    check (char_length(btrim(message)) between 1 and 5000),
  constraint contact_submissions_status
    check (status in ('received', 'email_failed'))
);

comment on table public.contact_submissions is
  'Messages submitted through the public Tutiba contact form. Written only by the server (service role) via /api/contact — no client-side inserts.';

-- Supports the server-side per-email rate-limit check in the contact route.
create index contact_submissions_email_created_at_idx
  on public.contact_submissions (email, created_at desc);

alter table public.contact_submissions enable row level security;

-- No anon/authenticated policies: all writes and reads go through the
-- server's service-role client, which bypasses RLS. This revoke is
-- belt-and-suspenders in case anyone later exposes the table to PostgREST.
revoke all on table public.contact_submissions from anon, authenticated;
grant all on table public.contact_submissions to service_role;

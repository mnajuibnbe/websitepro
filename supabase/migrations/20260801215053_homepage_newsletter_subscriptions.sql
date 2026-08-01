create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'homepage',
  created_at timestamptz not null default now(),
  constraint newsletter_subscriptions_email_normalized
    check (email = lower(btrim(email)) and char_length(email) between 3 and 320),
  constraint newsletter_subscriptions_email_format
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint newsletter_subscriptions_source
    check (source = 'homepage')
);

comment on table public.newsletter_subscriptions is
  'Email addresses submitted through the public Tutiba homepage newsletter form.';

alter table public.newsletter_subscriptions enable row level security;

create policy "Visitors can subscribe to the newsletter"
on public.newsletter_subscriptions
for insert
to anon, authenticated
with check (
  source = 'homepage'
  and email = lower(btrim(email))
  and char_length(email) between 3 and 320
);

revoke all on table public.newsletter_subscriptions from anon, authenticated;
grant insert (email, source) on table public.newsletter_subscriptions to anon, authenticated;
grant all on table public.newsletter_subscriptions to service_role;

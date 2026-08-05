# Known Issues
## Dual-currency pricing (verified 2026-08-04)
Checked production (`nhknhibsloirpffndzcd`) directly: both published courses have
non-null `price_egp` and `price_usd`. The "controlled unavailable state for
unbackfilled legacy prices" no longer applies to any live course — this is resolved.
Still open, unverified from this environment (no deploy/Preview access):
- No real payment-provider adapter exists. Paid checkout creates a pending immutable
  order and pending manual-approval enrollment; it does not charge a card.
- `x-vercel-ip-country` and authenticated `app_metadata.billing_country` resolution
  need a live Vercel Preview/production check.
- No user currency selector exists, so no display-only local-storage override was added.
## Legacy course missing approved_revision_id (verified 2026-08-04)
`Skin and Hair Cair Diploma Part 1` (`e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0`), published,
**5 active enrollments**, has `submitted_revision_id`/`approved_revision_id` both null
despite `review_status`/`authoring_status` = `approved`. Confirmed pre-existing
(created 2026-07-25, before the revision-lifecycle migration on 2026-07-30) and
confirmed harmless at runtime: `approved_revision_id` is never read by any frontend or
API code (grep confirms it's admin-workflow/audit metadata only), so the 5 enrolled
students are unaffected.
The only way to backfill it is `admin_finalize_course_for_review` →
`admin_decide_course_review('approved')`, but `admin_finalize_course_for_review`
requires `status='draft'` first — meaning fixing this means unpublishing the course
(locking student access via the `in_review` content-mutation trigger) for the duration
of a manual re-approval. Not a silent/automatic fix; needs a scheduled maintenance
window, explicitly opted into. `admin_get_workflow_health()` will keep flagging 1 course
under `published_without_approved_revision` until that window happens — that's expected,
not a regression.
## Course visibility (COURSE-VISIBILITY-FIX-001) — partially verified 2026-08-04
Production schema, courses/enrollments rows, and RLS (`rls_enabled=true` on every
table) are confirmed present and in place via the Supabase MCP connection — the
original "repository doesn't include credentials/schema" blocker in this doc no longer
applies from this environment. Still unverified: real Vercel Preview runtime behavior
(header-based country resolution, actual RLS grants under an authenticated session)
per `COURSE_VISIBILITY_TEST_RESULTS.md`.
## Security
- Leaked password protection: NOT enabled — requires Supabase Pro plan
  (HaveIBeenPwned check). Password length (8) and complexity requirements
  (lowercase, uppercase, digits, symbols) are enforced instead as a
  compensating control. Revisit if upgrading to Pro before launch.
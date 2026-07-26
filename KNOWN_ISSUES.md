# Known Issues

## Runtime verification required — course visibility

The repository does not include production credentials, a policy export, the base courses/enrollments schema, or the `admin_create_course` RPC migration. Before marking COURSE-VISIBILITY-FIX-001 fully resolved, verify the new migration, course/enrollment rows, RPC defaults, and Vercel Supabase environment alignment using `COURSE_VISIBILITY_TEST_RESULTS.md`.
## Dual-currency pricing runtime limitations (2026-07-26)

- Existing `courses.price` values have unknown/mixed semantics and are deliberately not copied. Published legacy courses show a controlled unavailable state until both new fields are backfilled.
- No real payment-provider adapter existed before this task. Paid checkout creates a pending immutable order and pending manual-approval enrollment; it does not charge a card.
- `x-vercel-ip-country` and authenticated `app_metadata.billing_country` behavior require Vercel Preview and production Supabase runtime verification.
- There is no pre-existing user currency selector, so no display-only local-storage override was added.

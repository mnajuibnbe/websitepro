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

CORRECTION (2026-08-05, verified via live browser test with a real enrolled
test account): the "harmless at runtime" claim above was WRONG. Opening any
lesson in this course returns "Lesson not found" for an actively enrolled
student — confirmed via direct RLS-level query (lesson row IS visible/
returned to the enrolled user at the database layer) AND via live frontend
test. The failure is NOT an RLS/enrollment access issue — it happens
downstream of the DB layer, isolated by testing a healthy course (Part 2,
non-null approved_revision_id) with the same test account, which worked
perfectly. Root cause is very likely the frontend/API lesson-loading logic
gating on approved_revision_id (or a related revision-lifecycle check) for
this specific legacy course. This actively blocks the 5 real enrolled
students from their paid content and should be reprioritized — the
Phase B-4 fix path (admin_finalize_course_for_review →
admin_decide_course_review('approved')) is no longer optional cleanup,
it's a functional bug fix.

The only way to backfill it is `admin_finalize_course_for_review` →
`admin_decide_course_review('approved')`, but `admin_finalize_course_for_review`
requires `status='draft'` first — meaning fixing this means unpublishing the course
(locking student access via the `in_review` content-mutation trigger) for the duration
of a manual re-approval. Not a silent/automatic fix; needs a scheduled maintenance
window, explicitly opted into. `admin_get_workflow_health()` will keep flagging 1 course
under `published_without_approved_revision` until that window happens — that's expected,
not a regression.

RESOLVED (2026-08-05, Phase B-4): `get_course_readiness()` for this course returned
`ready: false` (see the separate readiness-gap entry below), so the
`admin_finalize_course_for_review` path would have hard-failed on unrelated content
gaps. Applied a targeted backfill instead: `create_course_revision()` snapshotted the
course's current, unchanged, live state, and `submitted_revision_id`/
`approved_revision_id` were both set to that revision directly (no content, structure,
cover, or instructor changes). `admin_get_workflow_health().published_without_approved_revision`
is now `0`.

CORRECTION to the root-cause claim above: this revision-id backfill alone did **not**
fix the "Lesson not found" symptom. Re-verified directly against the DB after the
backfill — `LessonPlayer.tsx` never reads `approved_revision_id`/`submitted_revision_id`
at all; it loads a lesson only if the lesson's parent `course_sections` row also has
`is_published=true`. The real cause was the section/lesson publish-state mismatch
described as gap #4 below (3 of 6 lessons sat in a section that was `is_published=false`).

RESOLVED (2026-08-05): published section `a6809254-a198-43bc-ac18-8dd0df22edd4`
("Section 1: The Scientific Foundation of Cosmeceutics"), aligning it with the
lesson-level `is_published=true` flags its 3 lessons already had. Re-ran the same
live-query verification (simulating `LessonPlayer.tsx`'s section+lesson published join)
for all 6 lessons in the course — all 6 now resolve as reachable, not just the 3 in the
already-published Section 2. Confirmed legacy test/example data with no business stakes;
full content review (cover, instructor, video metadata — see gap #4's siblings below)
remains deferred to a dedicated pre-launch phase.
## Legacy course readiness gaps on 'Skin and Hair Cair Diploma Part 1' (found 2026-08-05, Phase B-4)
Discovered while attempting the documented `admin_finalize_course_for_review` repair
path for the `approved_revision_id` issue above: `get_course_readiness()` returns
`ready: false` for `e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0` for four reasons unrelated to
the revision-id bug. None of these were fixed (out of scope for the Phase B-4 data
cleanup — fixing them means picking a real instructor and cover asset, or changing live
content exposure, which are separate decisions):

1. **No managed cover.** `cover_image`/`thumbnail` point to a static asset
   (`/backgrounds/1.png`), not an image uploaded through the managed `course-covers`
   storage bucket. Also shows up in `admin_get_workflow_health().missing_managed_covers`.
2. **No approved instructor.** `author_id`/`instructor_id` is an admin account
   (`ac842aa4-c3f1-425b-b06a-ef20be93c91f`) with no `approved` row in
   `instructor_applications` and no public instructor profile.
3. **Unverified video metadata.** All 5 video lessons have
   `video_metadata_status='not_applicable'` — never verified, a residue of predating
   the revision-lifecycle migration.
4. **RESOLVED 2026-08-05 — was a live access-control inconsistency, not just a
   data-quality gap.** Section `a6809254-a198-43bc-ac18-8dd0df22edd4` ("Section 1: The
   Scientific Foundation of Cosmeceutics") was `is_published=false`, while its 3 lessons
   (`eb6ab00d…` "Lecture 1: Introduction", `5add5557…` "PDF 1", `ede3707c…` "Lecture 2")
   were individually marked `is_published=true`. The `lessons`/`course_sections` RLS
   policies only check the lesson's own `is_published` flag, not the parent section's, so
   these 3 lessons were readable at the RLS layer despite living in an "unpublished"
   section. This exact mismatch was also the confirmed root cause of the "Lesson not
   found" bug tracked in the entry above. Fixed by publishing the section (aligning it
   with the lesson-level flags already marking the content ready, rather than
   unpublishing already-live content); confirmed no business stakes since this is legacy
   test/example data. All 6 lessons in the course are now verified reachable through
   `LessonPlayer.tsx`'s actual join logic.

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
## Backups (2026-08-05)
No automated backups available — Supabase Free plan does not include daily
backups or point-in-time recovery. A real restore test (as originally
required) is not possible until upgrading to Pro.
Interim compensating control: manual row-count snapshot recorded before any
database-modifying phase, to detect unintended data loss.
Baseline snapshot (2026-08-05, before Phase B-1):
- enrollments: 16
- course_orders: 9
- courses: 8
- lesson_progress: 50
Revisit before real launch: upgrade to Pro and enable daily backups + PITR
before any real user/payment data exists.

## Admin-check inconsistency between tables (2026-08-05, discovered during Phase B-5 verification)
`enrollments` RLS checks admin status via the `users.role` DB column
(EXISTS query). `course_orders` RLS checks admin status via
`auth.jwt() -> app_metadata ->> role` instead. Both work correctly today,
but they're two different sources of truth — if a user's `users.role` is
changed without also updating their JWT app_metadata (which only refreshes
on next login), the two tables could disagree about the same user's admin
status. Not an active bug; worth unifying on one approach (recommend
DB-column-based, matching enrollments) during a future RLS audit — not
in scope for Phase B-5 (performance-only, no policy logic changes).

## Disaster-recovery gap: schema could not be rebuilt from migrations alone (found + fixed 2026-08-06)
While setting up the `tutiba-preview` Supabase project (`wcczuiwjkrsziehkiums`,
empty, staging-only) by replaying every file in `supabase/migrations/` against
it, discovered that **replaying every tracked migration in order against an
empty database did not reproduce production's schema** — meaning production's
schema could not have been rebuilt from this repo if the project were lost.
Two distinct classes of gap, both now closed:

**1. Four base tables predate the migrations folder entirely.**
`public.users`, `public.courses`, `public.lessons`, and `public.enrollments`
were created directly on production (original project scaffold, before this
`migrations/` directory existed) and no file in the repo ever created them.
The very first tracked migration (`20260724000000_course_learning_foundation.sql`)
already `ALTER`s `lessons` and references `courses`, so replay failed
immediately. Fixed by reverse-engineering production's live schema
(pg_catalog/information_schema) and subtracting every column/constraint/
index/policy that a *later* tracked migration adds, to reconstruct exactly
what existed immediately before `20260724000000` ran. Added as a new,
permanent migration: `supabase/migrations/20260723000000_baseline_pre_migration_schema.sql`
(dated to sort first). `public.newsletter_subscriptions` was initially
suspected to be part of this same gap but turned out to be created correctly
by `20260801215053_homepage_newsletter_subscriptions.sql` — an early
case-sensitive `grep` pass missed its lowercase `create table` statement.

**2. Untracked drift on tables that migrations DO create.** Several tables
created correctly by tracked migrations later received direct/ad-hoc changes
on production that were never captured as a migration — discovered by doing
a full live replay onto the preview project and diffing column/constraint/
index/policy/trigger counts and names against production. Fixed as a second
new migration, `supabase/migrations/20260725010000_untracked_schema_drift_repair.sql`
(positioned right after the migration that creates the affected tables):
- `course_sections`/`lessons`: production has a composite FK
  (`lessons_course_section_fkey`, `course_id, section_id → course_sections(course_id, id)`)
  plus a supporting composite unique constraint, `lessons.section_id NOT NULL`,
  and renamed/added indexes on both tables — none of which any migration
  file creates.
- `lessons`/`course_sections` RLS: 4 policies (2 per table) from the original
  `20260724000000` migration were dropped directly on production and never
  removed by any tracked migration; left dangling on a fresh replay.
- `lesson_progress`: its 4 RLS policies were renamed directly on production
  (e.g. "Users can view own lesson progress" → "Students can view own lesson
  progress"); `20260805201717_optimize_rls_initplan_and_fk_indexes.sql`'s
  `ALTER POLICY` statements target the renamed versions and fail against a
  fresh replay without this fix. Also missing the `set_updated_at` trigger on
  `course_sections` (×2, matching an existing duplicate-trigger pattern on
  `lessons`) and `lesson_progress` (×1) — present on production, created by
  no migration.

**Verified fixed**: after both new migrations, a full replay of all 78
migration files (76 original + 2 new) against the empty preview project
succeeded end to end (one file,
`20260805195536_backfill_legacy_course_revision_link.sql`, was intentionally
skipped on preview — it's a one-time DML backfill hardcoded to a specific
production course/admin row that doesn't exist on an empty database; this is
expected, not a defect). Post-replay, preview and production now match
exactly on: table count (31), index count (123), RLS policy count (78),
trigger count (29), and every constraint/index/policy *name* checked
individually on `users`/`courses`/`lessons`/`enrollments`/
`newsletter_subscriptions`/`course_sections`/`lesson_progress`.

**Residual, NOT fixed (recommend a dedicated follow-up schema-diff audit)**:
the same aggregate diff also turned up `public.blog_posts` having 2 fewer
columns on preview than production, plus one orphaned function
(`admin_create_course` exists on production, created by no migration) and one
migration-created function that no longer exists on production
(`admin_delete_empty_course`, created by `20260730000000_course_admin_issue_repairs.sql`).
These are outside the tables this investigation was scoped to and don't block
anything (the full migration replay already succeeds without touching them) —
flagging rather than fixing, since the pattern found above strongly suggests
more of this exists elsewhere in the other ~24 tables that weren't part of
this specific investigation.

## Multiple package manager lockfiles (2026-08-05, discovered during CI setup)
The repo tracks both `package-lock.json` (npm, used by CI) and `bun.lock`
(now stale relative to package.json), plus an untracked `pnpm-lock.yaml`
used by at least one local dev environment. CI only uses npm/package-lock,
so this is currently harmless, but different contributors/tools could
install different dependency versions depending on which lockfile their
package manager picks up. Recommend standardizing on one package manager
(npm, matching CI) and removing the other lockfiles before this becomes a
real bug source.


## Test data in production database (2026-08-07)
12 test orders exist in tutiba-platform (course_orders) from the B-9/B-10
implementation and testing phases — none are real students. Will be cleaned
up in Phase B-24.1 before launch, as planned.

## Payment proof upload accepts empty/negative-size files (found 2026-08-07, purchase-journey adversarial test)
`validatePaymentProofFile()` in `src/lib/paymentProof.ts:28-36` only rejects a
file when `file.size > PAYMENT_PROOF_MAX_BYTES`. It never checks the lower
bound, so:
- `{ type: 'image/png', size: 0 }` passes validation (returns `null`, no error).
- `{ type: 'image/jpeg', size: -1024 }` also passes validation.

A 0-byte or negative-size value can't be a real payment screenshot; a
0-byte "file" would upload successfully to the `payment-proofs` bucket
and create a `payment_submissions` row with no usable proof, requiring an
admin to notice and reject it manually rather than being caught client-side.
Negative sizes can't occur from a real browser `File` object but would slip
through if this function is ever called from a hand-built request bypassing
the file picker (e.g. a direct API call).

Reproduced by two failing tests intentionally left in
`src/domain/paymentProof.test.ts` ("rejects a zero-byte file", "rejects a
file reporting a negative size") — `npm test` currently reports 2 failing
out of 65; that is expected until this is fixed, not a regression to chase.

Fix: add a lower-bound check, e.g. `if (file.size <= 0) return 'Choose a
valid image file.'`, alongside the existing upper-bound check.

RESOLVED (2026-08-07): added the lower-bound check —
`validatePaymentProofFile()` now returns an error for `file.size <= 0`
alongside the existing upper-bound check. The two previously-failing tests
now pass with no change to their assertions; `npm test` is back to 0
failing.

## Duplicate payment_submissions can be filed against an already-decided order (found 2026-08-07, purchase-journey adversarial test)
The INSERT policy "Students can submit payment proof for own orders"
(`supabase/migrations/20260801000000_database_content_model_foundation.sql:251-259`)
only checks `status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
AND order belongs to caller`. It never checks the *order's* payment/enrollment
state, and there is no unique constraint on `payment_submissions.order_id`.

Live-verified against the `tutiba-preview` project (`wcczuiwjkrsziehkiums`):
after a submission was approved (order `payment_status='paid'`,
`enrollment_status='active'`), the same student could still insert another
`status='pending'` row for that same order. It then appeared in
`admin_list_pending_payment_submissions()`
(`supabase/migrations/20260807120000_admin_payment_submission_review.sql:37-69`)
indistinguishable from a genuine new purchase awaiting review.

Not exploitable for money/access — `admin_review_payment_submission()`
re-applying `approved` to an already-paid order is idempotent, and rejecting
the duplicate doesn't touch the (already active) enrollment or order. The
real cost is an unbounded, unrated-limited way for any authenticated student
to spam the admin review queue with junk rows against their own orders
(including already-resolved ones), with no dedupe.

Fix options for a future session: either (a) add a partial unique index
`payment_submissions (order_id) WHERE status = 'pending'` so only one
undecided submission can exist per order at a time, and/or (b) extend the
INSERT policy's `WITH CHECK` to require
`o.payment_status <> 'paid' AND NOT EXISTS (an existing pending submission
for this order)`. Reproduction script (creates disposable fixtures, runs the
check, rolls back — safe to re-run against `tutiba-preview` only, never
against production): `supabase/tests/purchase_journey_e2e_verification.sql`.

RESOLVED (2026-08-07): applied both fix options together via
`supabase/migrations/20260807150000_prevent_duplicate_payment_submissions.sql`,
since each closes a different half of the gap — the partial unique index
alone wouldn't catch resubmission against an order that's already approved
(approval flips the prior row's status away from `pending`, freeing the
slot for a new one), and the `WITH CHECK` extension alone wouldn't catch a
same-order race between two still-pending inserts (a `WITH CHECK` isn't
atomic across concurrent transactions). Verified against `tutiba-preview`
(`wcczuiwjkrsziehkiums`) only via disposable fixtures wrapped in
`BEGIN`/`ROLLBACK`
(`supabase/tests/payment_submission_duplicate_prevention_verification.sql`):
a submission against an already-paid order is now rejected
(`insufficient_privilege`), a second pending submission for a still-unpaid
order is rejected (`unique_violation`), and the legitimate first pending
submission still succeeds. Preview data confirmed unchanged after
rollback; security/performance advisors show no new findings.
**Not yet applied to production** (`nhknhibsloirpffndzcd`) — recommend
applying promptly since this is an active gap on a live payment flow.



## Certificate feature hidden pending a real implementation (2026-08-08)
Phase B-16's audit found the certificate feature was entirely client-side
theater: no `certificates` table exists anywhere in the schema, nothing is
durably issued (certificate ID and completion date are recomputed live in
the browser on every page load — completion date is always "today"), and
the "verification link" doesn't verify a specific credential — it just
re-renders whoever is currently logged in as if they hold the certificate
for that course id. `Achievements.tsx` also showed fully hardcoded fake
certificate/badge data unrelated to any real student.

The whole flow is now hidden behind `FEATURE_FLAGS.certificates` (off) as a
stopgap. Not fixed, because a correct fix requires a real `certificates`
table with a persisted issuance event (student id, course id, snapshotted
course title, real completion timestamp, a non-guessable serial), a
server-side eligibility check backing the client-side one, and an actual
third-party verification lookup — a project-sized piece of work, not a
quick patch. Recommend scoping this as its own future phase before
re-enabling the flag.


## Not working cover_image URL on published course (2026-08-08)
Course "Skin and Hair Cair Diploma Part 1" has cover_image pointing at
https://tutiba.vercel.app/backgrounds/1.png — a Not working URL from an apparently
earlier deployment (not the current production domain
websitepro-seven.vercel.app). Discovered during Phase B-18 (SEO) since it
breaks Open Graph image previews and Course structured data image for this
course. Needs the DB field updated to a live asset URL.

## Password from Database Not Clear (2026-08-08) — RESOLVED 2026-08-13
When I try to reset the password, I encounter an issue.  
This password does not match the password complexity requirements;  
I got a general error. The message is a general one;  
I think it is from the database, but this error does not indicate  
exactly where the issue is.  
For example, in my trial, it was related to password complexity.  
It must say, for example,  
"Here you must choose one uppercase letter, one lowercase letter, and so on."  
Or, just what is still missing, not all combinations.  
If this error is clear from the database, then just show it.

RESOLUTION: The static hint text under the password field (UpdatePassword.tsx
and RegisterPage.tsx, both used the same copy) only said "Use at least 8
characters. A longer, unique password is more secure." — it never told the
user about the uppercase/lowercase/digit/symbol rules Supabase actually
enforces (see "Security" section above), so a rejected password looked
unexplained. Both hints now state the real requirements up front: "Use at
least 8 characters, including an uppercase letter, a lowercase letter, a
number, and a symbol." Parsing Supabase's raw rejection error into a
field-specific message was not in scope for this pass.

## Certificate overclaim also on About page (2026-08-09) — RESOLVED 2026-08-13
Phase B-20's copy rewrite removed unsubstantiated certificate claims from
the homepage flow (Hero, Outcomes, FinalCTA, Instructor, FAQ), since the
certificate feature is fully disabled (`certificates: false` in
featureFlags.ts — no table, nothing durably issued, per FEATURE_FLAGS.md).
The same overclaim still exists on src/pages/About.tsx:44 ("Verified
Achievement... Certificates that recognize completed learning") and
possibly the standalone FAQ page/Footer — not fixed, flagged as a
follow-up copy pass with the same scope as B-20.

RESOLUTION: Replaced the "Verified Achievement / Certificates that
recognize completed learning" card on About.tsx with "Lifetime Access /
Return to your courses anytime as lessons and resources are updated" — a
claim already made truthfully elsewhere (WhyChooseUs' "Lifetime Updates").
Also found and fixed the same overclaim in Footer.tsx's site-wide trust
line ("Certificate on completion", shown on every page) — replaced with
"Lifetime course access". FAQ page checked — its certificate copy
("Certificates are not issued on the platform yet...") is already
accurate, no change needed.

## Dead "Meet Your Instructor" button (2026-08-09) — RESOLVED 2026-08-13
src/components/sections/InstructorSection.tsx:81 — the "Meet Your
Instructor" button has no onClick handler; it renders but does nothing.
Pre-existing bug, discovered during B-20's copy pass but out of scope for a
copy-only task. Needs either a real destination (instructor bio
page/section) or removal if no such content exists.

RESOLUTION: Searched for any instructor bio route/section/anchor
(App.tsx routes, CourseInstructor.tsx, InstructorApplication/Courses
pages) — none exists for the platform's own instructor (Dr. Aya
Elbrashy) shown in this section; those routes are for course authoring
by instructor-role users, not a public bio page. No honest destination
exists, so the button was removed rather than left dead.


##
src/components/sections/FreeContent.tsx
& src/components/layout/MobileDrawerBackdrop.tsx 
Not used anywhere 

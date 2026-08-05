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

## Multiple package manager lockfiles (2026-08-05, discovered during CI setup)
The repo tracks both `package-lock.json` (npm, used by CI) and `bun.lock`
(now stale relative to package.json), plus an untracked `pnpm-lock.yaml`
used by at least one local dev environment. CI only uses npm/package-lock,
so this is currently harmless, but different contributors/tools could
install different dependency versions depending on which lockfile their
package manager picks up. Recommend standardizing on one package manager
(npm, matching CI) and removing the other lockfiles before this becomes a
real bug source.
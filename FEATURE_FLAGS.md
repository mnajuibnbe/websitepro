# Feature Flags

Single source of truth: [`src/config/featureFlags.ts`](src/config/featureFlags.ts).

These flags hide features that are fully built and still shipped in the
codebase, but have zero real usage and would look broken or empty if a
student found them. Flipping a flag to `true` and redeploying is the entire
re-enable procedure — no other code, schema, or data changes are needed.

## `assignments` (currently `false`)

Hides the assignment lesson experience from students.

- `AssignmentLessonRenderer` is skipped in [`src/pages/LessonPlayer.tsx`](src/pages/LessonPlayer.tsx)
  for lessons with `content_type === 'assignment'`; the lesson falls through
  to the existing "content type not supported yet" state instead of showing
  a real-but-unused submission form.
- The "Assignment" content-type badge in [`src/components/player/LessonDetails.tsx`](src/components/player/LessonDetails.tsx)
  falls back to the generic "Reading lesson" label.
- Admin-side assignment authoring (`AssignmentBuilder`, curriculum builder
  "assignment" item type, `AdminLessonEditor`) is untouched and stays fully
  usable — admins can keep building assignment lessons while the flag is
  off; students just won't see them rendered as assignments until the flag
  flips on.
- Data: `assignment_definitions` and `assignment_submissions` tables and all
  RPCs (`get_assignment_for_lesson`, `submit_assignment`) are untouched.

**Re-enable:** set `assignments: true` in `src/config/featureFlags.ts`.

## `instructorProgramme` (currently `false`)

Hides the self-serve "become an instructor" flow. The platform currently has
a single author (the owner), so this has effectively no real applicants.

- The "Become an instructor" link in the student dashboard sidebar
  ([`src/components/dashboard/Sidebar.tsx`](src/components/dashboard/Sidebar.tsx))
  is not rendered.
- The `/instructor/apply` route in [`src/App.tsx`](src/App.tsx) renders the
  404 page instead of `InstructorApplication` while the flag is off (the
  page component itself is untouched).
- Admin review UI (`/admin/instructors`,
  [`src/pages/admin/AdminInstructorApplications.tsx`](src/pages/admin/AdminInstructorApplications.tsx))
  — including the "invite instructor by email" action — is untouched and
  stays fully usable. Note: an email invite links to `/instructor/apply`, so
  flip this flag on before sending an invite.
- Data: `instructor_applications` table and its RPCs are untouched; the one
  existing application row is preserved.

**Re-enable:** set `instructorProgramme: true` in `src/config/featureFlags.ts`.

## `newsletter` (currently `false`)

Hides the homepage newsletter signup section. The form is fully functional,
but no email-sending service is connected to `newsletter_subscriptions` yet,
so subscribers currently get nothing.

- The `<Newsletter />` section is not rendered in
  [`src/pages/Home.tsx`](src/pages/Home.tsx); `FinalCTA` is now the last
  homepage section, no gap or dead space is left behind.
- Data: the `newsletter_subscriptions` table, its RLS, and the one existing
  real subscriber row are untouched and were not modified in any way.

**Re-enable:** set `newsletter: true` in `src/config/featureFlags.ts`. Do
this once an actual sending service is wired up, otherwise subscribers will
sign up expecting emails that never arrive.

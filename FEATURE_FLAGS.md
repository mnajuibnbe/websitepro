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

## `certificates` (currently `false`)

Hides the certificate feature. It's entirely client-side today: there is no
`certificates` table, nothing is durably issued, and the "verification
link" doesn't actually verify a specific credential. It's not gated because
it's unused — it's gated because it's fake, and showing it would mislead a
student into thinking they hold a real, verifiable credential.

- The "Certificate" button on completed courses in
  [`src/pages/MyCourses.tsx`](src/pages/MyCourses.tsx) is not rendered
  (an empty spacer keeps the row's flex layout intact).
- The `/certificate` route in [`src/App.tsx`](src/App.tsx) renders the 404
  page instead of `CertificatePage` while the flag is off (`CertificatePage`
  and `src/components/certificate/*` are untouched).
- The "Certificates" nav item in
  [`src/components/dashboard/Sidebar.tsx`](src/components/dashboard/Sidebar.tsx)
  is not rendered.
- [`src/components/dashboard/Achievements.tsx`](src/components/dashboard/Achievements.tsx)
  renders nothing. Its content was hardcoded fake data (a fixed certificate
  title and a fake completion date unrelated to any real student activity),
  not real-but-unused data, so unlike the other flags it has nothing valid
  to fall back to — the whole widget is dropped from the dashboard while the
  flag is off, with no layout gap left behind.
- Marketing copy that merely mentions "certificate" as a course benefit
  (About, FAQ, homepage sections, footer, etc.) is untouched — that's a
  separate copy pass, not part of this flag.

**Re-enable:** set `certificates: true` in `src/config/featureFlags.ts`.
Do this only once real certificate issuance is backed by a persisted,
verifiable record — flipping the flag today would restore the fake
Achievements data along with the rest of the flow, since none of the
underlying issues are fixed by this flag.

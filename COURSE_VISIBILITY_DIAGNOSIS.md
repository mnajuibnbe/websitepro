# Course Visibility Diagnosis — COURSE-VISIBILITY-FIX-001

## Observed symptoms

A course managed by an administrator can be absent from Home, the public catalogue, Dashboard, and My Courses. The repository has no production credentials or database dump, so database-row and deployed-policy claims below are explicitly separated from code-proven causes.

## Intended rules found in the repository

`Course.status` defines `draft`, `published`, and `archived`; `Course.is_featured` exists for Home selection. Enrollments use `pending`, `active`, and `cancelled`. Learning access checks `status = 'active'`, and lesson/section RLS requires `has_active_enrollment(course_id)`. Thus drafts remain admin-only, public catalogue rows are published/public, Home is the featured subset, pending is displayed as pending by the existing enrolment UX, and only active enrollment unlocks learning.

## Root cause by surface

### Home — proven in code

`FeaturedCourses.tsx` queried `status = 'active'`. Admin create/edit/builder and the shared type publish courses with `status = 'published'`; `active` is an enrollment status, not a course publication status. The query also ignored the existing `is_featured` field despite presenting a featured section. Finally, Supabase errors were swallowed and rendered as no section.

**Repair:** query `status = 'published' AND is_featured = true`, retain newest-three ordering, and show a retryable error. A published non-featured course is intentionally absent from Home.

### Public Courses — proven in code; deployed RLS requires runtime verification

`CourseGrid.tsx` also queried the nonexistent course publication value `active`, proving why correctly published rows were filtered out. It already distinguished errors from empty results. The repository contained no migration defining SELECT policies for `courses`, so the exact production RLS state is not provable from source.

**Repair:** query `published`. Add an additive, least-privilege policy allowing anon/authenticated SELECT only when `status = 'published'` and visibility is public (null legacy visibility is treated as public).

### Dashboard / My Courses — mixed: UI causes proven; deployed RLS/data require runtime verification

All student queries correctly bind `enrollments.user_id` to the authenticated `auth.users` UUID (`user.id`) and select `status = 'active'`. However:

* Dashboard ignored the enrollment count error and converted it into `hasEnrollments = false`.
* Dashboard child components ignored enrollment/course errors.
* `MyCoursesList` and `ContinueLearning` fell back to arbitrary public courses when no active enrollment/course was returned, mixing catalogue and enrollment data and potentially opening `/learn/:id` without entitlement.
* The repository contained no enrollment SELECT policy. Admin access can therefore work under a separate policy while student SELECT returns no rows. Whether this is the production condition needs Supabase policy/runtime evidence.

`MyCourses.tsx` already surfaces enrollment/course failures and selects active enrollments only. Its second course query can still return no row if deployed course RLS is missing or differs; that production cause cannot be proven locally.

**Repair:** fail visibly on enrollment/course errors, remove public-course fallbacks from enrollment widgets, and add own-row enrollment SELECT RLS. The public published-course policy lets the separate course lookup resolve without exposing draft/private data. Existing lesson policies and service-side lesson-course enrollment authorization are unchanged.

## Affected data flow and files

* Admin writes: `AdminCourseCreate.tsx` calls `admin_create_course`; edit/manager/builder write `draft|published|archived` and `published_at`. The RPC definition and base courses schema are absent from this repository, so defaults for `is_featured`/`visibility` require production inspection.
* Home: `src/components/sections/FeaturedCourses.tsx`.
* Catalogue: `src/components/courses/CourseGrid.tsx`.
* Student: `src/pages/Dashboard.tsx`, `src/pages/MyCourses.tsx`, `src/components/dashboard/MyCoursesList.tsx`, and `src/components/dashboard/ContinueLearning.tsx`.
* Security: `supabase/migrations/20260726000000_course_visibility_rls.sql`; protected curriculum remains governed by `20260724000000_course_learning_foundation.sql`.

## Policy before and after

**Before (repository evidence):** no tracked `courses` or `enrollments` SELECT policy; actual dashboard-created production policies unknown.

**After:** anon/authenticated users can select only published public catalogue course rows. An active student can additionally resolve the published metadata for their enrolled course even when that course is private or unlisted. Authenticated users can select only enrollment rows whose `user_id = auth.uid()`. Existing admin policies are neither dropped nor replaced. This does not authorize lesson access; published lessons/sections still require active enrollment.

## Security impact

The change does not put a service-role key in the client, reveal drafts, expose private/unlisted courses to the public or unenrolled users, expose another student's enrollment, or weaken protected lesson authorization. An active enrollee can read only the published metadata for that enrolled course. Pending/cancelled/rejected rows may be read by their owner so existing UX can report status, but only `active` rows are displayed as owned courses and accepted by learning authorization. Progress-query failures are rethrown to the owning page/widget instead of being converted to a misleading 0% result.

## Remaining runtime verification / required evidence

1. Supabase Table Editor rows (redacted): course `id`, `status`, `visibility`, `is_featured`; enrollment `course_id`, `user_id`, `status`; confirm enrollment `user_id` equals the student's Auth user UUID.
2. Supabase policy listing for `public.courses` and `public.enrollments` after applying migrations.
3. Browser Network responses for the `courses` and `enrollments` REST requests in Vercel Preview, including HTTP status and safe PostgREST error code/message (no tokens).
4. Vercel Preview/Production variable presence and project-ref agreement for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; server-only variables are irrelevant to these browser reads.
5. Confirm the production `admin_create_course` RPC initializes `status='draft'`, a deliberate `is_featured` value, and a deliberate visibility value.

## Rollback

Revert the frontend commit. For database-only rollback, apply a new migration that drops policies `Public can view published courses`, `Active students can view enrolled published courses`, and `Students can view own enrollments`; restore the prior policies from the production policy export. Do not disable RLS. If production already has equivalent differently named policies, retain them after reviewing their predicates.

# Course Visibility Test Results — COURSE-VISIBILITY-FIX-001

## Automated/static verification

| Case | Result | Evidence |
|---|---|---|
| Latest published public course on Home | Pass (logic) | Query requires `published`, orders newest first and does not depend on an Admin-unmanageable featured flag. |
| Published private/unlisted Home behavior | Pass (policy) | Excluded for public/unenrolled visitors by RLS. |
| Published course in catalogue | Pass (logic) | Catalogue query uses `published`. |
| Draft hidden publicly | Pass (logic/policy) | Both query and RLS public predicate exclude draft. |
| Active enrollment in Dashboard | Pass (logic), runtime required | Count and widgets use active + authenticated user UUID; errors are no longer empty. |
| Active enrollment in My Courses | Pass (logic), runtime required | Existing active own-user query retained; own-row RLS added. |
| Pending behavior | Pass (logic) | Not shown as owned course; existing detail/learn views retain pending messaging. |
| Unenrolled absent from My Courses | Pass (logic) | Catalogue fallbacks removed. |
| Unauthorized protected lesson | Pass (static/existing tests) | Active-enrollment RLS and server lesson-course authorization unchanged. |
| Query failure is not false empty | Pass (logic) | Home, catalogue, Dashboard, My Courses, and dashboard widgets have distinct error behavior; progress errors propagate rather than becoming 0%. |
| Admin approves pending request | Pass (logic/policy), runtime required | Visible button, verified returned update row, and admin-only pending-to-active RLS policy. |

Production-backed results are not claimed because no Supabase/Vercel credentials or representative rows are available in this environment.

## Exact Vercel Preview checklist

1. Deploy the commit to Preview with the new migration applied to the Preview Supabase project.
2. Verify Preview has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and that both identify the same project; redeploy after any variable change.
3. As admin, create course A. Confirm it starts draft and is visible in admin but absent from `/` and `/courses`.
4. Publish A and set public visibility. In an incognito anonymous session confirm A appears on `/` and `/courses`, and `/course/:id` opens.
5. Set A private and then unlisted. Confirm it disappears from the anonymous Home/catalogue. Restore public visibility and confirm it returns.
6. Force a safe query failure (for example, point a disposable Preview deployment at an invalid anon key). Confirm Home/Courses show error/retry rather than an empty catalogue; restore the key and redeploy.
7. Sign in as student S with no enrollment. Confirm A may appear publicly but does not appear in `/dashboard` owned-course widgets or `/my-courses`; direct protected lesson access is denied.
8. Create a pending enrollment for S/A. Confirm it remains absent from owned-course lists, course detail reports pending, and `/learn/:courseId` reports pending/denies lessons. As admin, click the now-visible approval button and confirm the row changes to active before the UI reports success.
9. Change the same enrollment to active. Confirm A appears in Dashboard and My Courses and opens its published learning content. Repeat after setting A private or unlisted: it must remain absent from the public catalogue but visible to S as the active enrollee.
10. Change the enrollment to cancelled (and separately test any production-supported rejected/expired/revoked values). Confirm owned-course and lesson access are removed.
11. In DevTools Network, confirm no failed `courses`/`enrollments` call is represented as a legitimate empty state. Record only status and PostgREST error code, never Authorization headers.

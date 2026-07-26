# Course Visibility Test Results — COURSE-VISIBILITY-FIX-001

## Automated/static verification

| Case | Result | Evidence |
|---|---|---|
| Latest published public course on Home | Pass (logic) | Query requires `published`, orders newest first and does not depend on an Admin-unmanageable featured flag. |
| Admin-controlled Home order | Pass (logic/schema), runtime required | Positive optional order wins; blank order falls back to newest published; one query feeds mobile and desktop. |
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
| Catalogue filters/search/sort | Pass (automated logic), runtime required | Controls share state with real Supabase results; tests cover text/category/level/price and sort directions. |
| Admin denies pending request | Pass (logic/policy), runtime required | Verified pending-to-cancelled update, denied UX, and no active access. |

Production-backed results are not claimed because no Supabase/Vercel credentials or representative rows are available in this environment.

## Exact Vercel Preview checklist

1. Deploy the commit to Preview with the new migration applied to the Preview Supabase project.
2. Verify Preview has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and that both identify the same project; redeploy after any variable change.
3. As admin, create course A. Confirm it starts draft and is visible in admin but absent from `/` and `/courses`.
4. Publish A and set public visibility. In an incognito anonymous session confirm A appears on `/` and `/courses`, and `/course/:id` opens.
5. Set A private and then unlisted. Confirm it disappears from the anonymous Home/catalogue. Restore public visibility and confirm it returns.
6. Force a safe query failure (for example, point a disposable Preview deployment at an invalid anon key). Confirm Home/Courses show error/retry rather than an empty catalogue; restore the key and redeploy.
7. Sign in as student S with no enrollment. Confirm A may appear publicly but does not appear in `/dashboard` owned-course widgets or `/my-courses`; direct protected lesson access is denied.
8. Create two pending enrollments. As admin, approve one and deny the other. Confirm the UI reports success only after each returned update; the denied row becomes `cancelled`, shows rejected status to that student, and grants no course access.
9. Change the same enrollment to active. Confirm A appears in Dashboard and My Courses and opens its published learning content. Repeat after setting A private or unlisted: it must remain absent from the public catalogue but visible to S as the active enrollee.
10. Change the enrollment to cancelled (and separately test any production-supported rejected/expired/revoked values). Confirm owned-course and lesson access are removed.
11. In DevTools Network, confirm no failed `courses`/`enrollments` call is represented as a legitimate empty state. Record only status and PostgREST error code, never Authorization headers.
12. On `/courses`, test Arabic/English title search, category shortcuts/sidebar, levels, free/paid, duration, newest and both price sorts, clear chips, accurate count, no-match state, and pagination reset.
13. Repeat catalogue controls at a narrow mobile viewport: search and sort remain visible, the filter button opens/closes the same controlled filters, the result count remains accurate, and course-card navigation works.
14. At a narrow Admin viewport, horizontally scroll the request table and verify both approve and deny buttons remain visible, enabled as appropriate, and perform the same verified mutations as desktop.
15. Leave all Home order inputs blank and confirm Home is newest-published first on desktop and mobile. Then set two published courses to order 1 and 2 in Admin; confirm that order leads on both viewports and clearing the values restores automatic newest-first behavior.

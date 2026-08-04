# Implementation Log

## 2026-08-04 — Homepage intro video required two presses; homepage price inconsistency

### Proven root cause (video)

`HeroSection` only mounted `SecureStreamProvider` (and therefore the `<video>` element)
after the visitor clicked "Play welcome video." `SecureStreamProvider` then made a
`POST /api/video/token` round trip (~5s) before it had a `src` to render. By the time
the `<video autoPlay>` element existed, the browser's user-activation window from the
original click had expired, so unmuted autoplay was silently blocked — the visitor saw
a loading spinner, then nothing, and had to press the play button that appeared. Lesson
videos in `VideoLessonRenderer`/`VideoProviderResolver` don't autoplay, so they weren't
affected by this specific bug, but they pay the same token round trip on first load.

### Fix

- Added `prefetchHomepageIntroStream()` (`src/components/video/SecureStreamProvider.tsx`),
  reusing the existing `requestStreamUrl` cache.
- `HeroSection` now calls it on mount, so the token/stream URL is typically already
  resolved by the time the visitor clicks Play — the click and the `<video autoPlay>`
  mount happen close enough together that the browser honors the autoplay.
- Not fixed: the underlying per-play Google Drive proxy fetch (`Cache-Control: no-store`,
  live `files.get` call in `worker/src/index.ts` / `src/server/controllers/video.controller.ts`)
  is the dominant cost in the reported "~5 second load," and is architectural — no
  client-side change removes it. Reducing it would mean caching video bytes at the edge
  or moving off Google Drive as the source, which is a hosting decision, not a bug fix.

### Proven root cause (price inconsistency)

`src/lib/homepageMarketing.ts` exported a hardcoded `PRIMARY_DIPLOMA_CTA = 'Enroll in
Part 1 — EGP 300'`, used verbatim by both `LearningMethod` and `FinalCTA`. It was never
wired to the dual-currency resolver (`usePricingContext` / `resolveCoursePrice`) that
`FeaturedCourses` already used correctly, so the same course showed "USD 30" in the
course grid and "EGP 300" a few sections later on the same page — visible on every
homepage load regardless of visitor region.

### Fix

- Added `usePrimaryDiplomaOffer()` (`src/hooks/useHomepageMarketing.ts`): resolves the
  primary diploma course through `useCourseCatalog({ id, pricingContext })` and formats
  its CTA with the existing `formatHomepageCourseCta`, the same helper `FeaturedCourses`
  uses.
- `LearningMethod` and `FinalCTA` now consume this hook instead of the hardcoded string.
  `PRIMARY_DIPLOMA_CTA` was removed in favor of `PRIMARY_DIPLOMA_CTA_FALLBACK` (used only
  before the price resolves).
- Verified live at 390/768/1440px: both sections now read "Enroll in Part 1 — USD 30",
  matching Featured Courses.

## 2026-07-26 — VIDEO-STREAM-DIAG-001

### Proven root cause

The production Vercel function exited during ESM module resolution with
`ERR_MODULE_NOT_FOUND`. The compiled `api/index.js` attempted to import the
extensionless path `/var/task/src/server/routes/video.routes`, so Express never
started and `POST /api/video/token` returned
`500 FUNCTION_INVOCATION_FAILED` before making any external request.

### Changes

- Added explicit `.js` extensions to server-side relative ESM imports so the
  TypeScript sources resolve correctly after Vercel compiles them to JavaScript.
- Preserved the existing Google Drive streaming and HTTP Range implementation.
- Added required server-environment validation and startup diagnostics.
- Added safe token errors with correlation IDs; detailed exceptions remain in
  server logs.
- Bound enrollment authorization to the requested lesson's `course_id`.
- Added token-controller and environment-validation tests for success, missing
  configuration, authentication, lesson existence, course access, missing video
  IDs, and safe server-failure behavior.

### Required server environment

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STREAMING_TOKEN_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

The browser build additionally requires `VITE_SUPABASE_ANON_KEY`.

### Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- API entry-point ESM bundle and syntax smoke check

## 2026-07-26 — Lesson workspace reload loop

### Proven root cause

Supabase can emit `SIGNED_IN` repeatedly when an existing session is confirmed,
including when a browser tab is refocused. `AuthContext` mapped every event to a
new local user object, while `LessonPlayer` depended on that object by reference.
Each event therefore reran the complete access/data loader, returned the page to
"جاري تحميل مساحة التعلم", unmounted the video player, and caused its active
media/HEAD probes to be aborted and restarted.

### Fix

- Preserve the existing local user object when its meaningful user fields have
  not changed.
- Depend on the stable authenticated user ID in the lesson-loading effect rather
  than the full user object.
- Preserve token refresh handling and all authentication and authorization
  checks.

## 2026-07-26 — Google Drive media 403 and hanging stream

### Proven root cause

Production logs showed that Drive metadata succeeded, but the subsequent
`files.get({ alt: 'media' })` call returned HTTP 403. The controller had already
sent `206` headers before awaiting that upstream call, so it could not return the
real failure and the Vercel invocation remained open until its five-minute
timeout. Express also handled media `HEAD` probes through the GET handler, which
started and immediately aborted unnecessary full Drive downloads.

### Fix

- Added a metadata-only HEAD endpoint.
- Await the Google Drive media response before committing 200/206 headers.
- Abort only when the response closes before completion, rather than on the
  request object's normal close event.
- Preserve all Range calculations, seeking headers, JWT checks, and access
  authorization.

## 2026-07-26 — In-course lesson navigation experience

### Root cause

Changing only the lesson route reran the complete enrollment, course, sections,
lessons, and progress loader. That set the page-level access state back to
`verifying`, unmounted the whole workspace, and displayed the full-screen
"جاري تحميل مساحة التعلم" screen between adjacent lessons.

### Fix

- Reuse the already-authorized course and lesson collection when navigating
  between lessons in the same course.
- Switch the current lesson in place while keeping the header, sidebar, and
  workspace mounted.
- Continue recording `last_accessed_at` for the selected lesson and preserve the
  full authorization/data-loading path for initial loads, refreshes, user
  changes, and course changes.
## 2026-07-26 — Secure dual-country pricing

- Inspected the legacy `courses.price` flow: public cards/detail parsed it in the browser, Checkout was hard-coded/mock-only, enrollment was inserted directly by the browser, and no repository order schema/payment adapter/country resolver existed.
- Added nullable `NUMERIC(12,2)` EGP/USD fields without changing the legacy field, protected order snapshots, Admin RPC/form support, a single typed resolver, and server checkout validation.
- Public queries remain limited by existing published-course RLS. New order RLS permits owners/Admin to read, Admin status decisions to update, and has no browser create/delete policy.

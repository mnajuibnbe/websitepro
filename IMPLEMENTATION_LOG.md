# Implementation Log

## 2026-08-16 — Blog SEO editor Phase 3: content-depth tooling

Added Internal Linking Assistant, Original Value Checker, and Sources/Citations to the
block-based blog editor's SEO sidebar (Phase 1/2: `bd6558f`). All advisory, never
gating, matching the existing Content SEO Score's soft-signal design.

- **Internal Linking Assistant** (`src/lib/blogInternalLinks.ts`,
  `src/components/blog/InternalLinkingPanel.tsx`): no external API — ranks this site's
  own published courses/blog posts by title/topic token overlap against the article and
  lets the admin insert a link with one click. Reuses `blog_posts`/`courses` queries in
  the same shape as `LinkPickerDialog`'s existing internal-link picker.
- **Original Value Checker** (`src/lib/blogOriginalValue.ts`,
  `src/components/blog/OriginalValuePanel.tsx`): self-reported checklist (personal
  experience, original research, data, screenshots, case study, expert opinion,
  original examples, testing results, unique process) — never auto-detected. New
  `blog_posts.original_value_signals text[]` column, DB-constrained to the fixed set.
- **Sources/Citations** (`src/lib/blogSources.ts`,
  `src/components/blog/SourcesPanel.tsx`, `src/components/blog/BlogSourcesList.tsx`):
  structured `{ name, url, accessedDate }` list, kept separate from the free-form
  article HTML (unlike Internal Linking, which appends into content) so each entry
  stays individually editable/removable. New `blog_posts.sources jsonb` column. Renders
  as a numbered "Sources" section on the public article page, `rel="nofollow"`.
- `blogSeoScore.ts`'s `internal_links` and `trust_sources` categories are now real
  (computed from the above), no longer stubs. `topic_coverage` remains a stub.

**Not built — reported instead of faked:** Topic Coverage (subtopic checklist) and
"Questions Readers May Have" both need real topical judgment (an LLM call), not
keyword matching. Checked this environment for a configured Gemini/Google AI key: none
exists — `.env.local` has no such entry, `@google/genai` (already an installed
dependency) is unused anywhere in `src/`, and no prior `.env.example` placeholder
existed for one. Added a blank `GEMINI_API_KEY=` placeholder to `.env.example` and a
clearly-labeled "not available" panel in `SeoSidebar.tsx` instead of a weaker
pattern-matching substitute. Needs a Gemini API key to unblock (Phase 3.5 or later).

Migration: `supabase/migrations/20260816150000_blog_posts_content_depth_columns.sql`
(applied directly to `nhknhibsloirpffndzcd` via Supabase MCP). RLS unaffected — existing
row-level admin/public policies already cover the new columns.

Verified: `npm run lint`, `npm test` (205 pass, incl. new `blogInternalLinks.test.ts`,
`blogOriginalValue.test.ts`, `blogSources.test.ts`), `npm run test:frontend` (54 pass,
incl. new `blog-content-depth.frontend.test.tsx`), `npm run build` (prerender of
existing sample posts with empty `sources` confirms no regression). The admin-only
sidebar panels (Internal Linking/Original Value/Sources UI) were not exercised live in
a browser — this session had no admin login credentials; the public Sources rendering
path was verified live instead (loaded, no console errors, correctly renders nothing
when a post has no sources).

## 2026-08-16 — Blog SEO editor Phase 3 (continued): Topic Coverage & Reader Questions

`GEMINI_API_KEY` was added to Vercel Production (not to this session's `.env.local`),
unblocking the two panels reported as missing above. Implemented both server-side only.

- **`src/server/services/gemini.service.ts`**: calls `@google/genai`
  (`gemini-2.5-flash`, JSON-schema-constrained response) with a prompt built from the
  article's target topic/query and its plain-text content. Prompt building and response
  parsing are pure functions (`buildTopicInsightsPrompt`, `parseTopicInsightsResponse`),
  tested directly; the live network call itself is untested, matching this codebase's
  existing convention for external-API wrappers (`email.service.ts`'s `sendEmail` has no
  direct test either).
- **`POST /api/blog/topic-insights`** (`src/server/routes/blog-insights.routes.ts`,
  registered in both `server.ts` and `api/index.ts`): admin-only (same bearer-token +
  `users.role`/`app_metadata.role` check as `contact.routes.ts`/`instructor.routes.ts`),
  a 20-requests/10-minutes per-IP limiter (each call is a billed Gemini request), input
  length caps, and a 503 (not 500) with `{ error, reason }` on any failure — including a
  missing key — so the client can show a clear "unavailable" state without crashing.
  **The API key is read from `process.env.GEMINI_API_KEY` server-side only and is never
  sent to the client** — confirmed by grepping the production `dist/assets/*.js` client
  bundle post-build for `GoogleGenAI`/`genai`/`GEMINI_API_KEY`: zero matches (the one
  `genai` hit found was Sentry's unrelated built-in `hasGenAiSpans` instrumentation).
- **Client wiring**: `src/services/blogInsights.service.ts` (fetch wrapper, throws
  `BlogInsightsUnavailableError` on a 503 so the panel can distinguish "not configured"
  from a one-off failure) and `src/components/blog/TopicInsightsPanel.tsx`, replacing
  the "not available" stub in `SeoSidebar.tsx`. Explicit "Analyze" button, not a typing
  debounce — each call is billed, so it should only fire on deliberate request, and nothing
  else in this sidebar auto-triggers a paid external call. On success: Topic Coverage
  renders a covered/missing checklist (no insert action — it's informational); Reader
  Questions renders a list with "+ Add to article" per question, inserting an FAQ block
  (`src/lib/blogQuestionInsert.ts`, HTML-escaped) matching `FaqExtension.tsx`'s own
  `parseHTML` contract — reusing the existing FAQ block rather than inventing a new one.
- `blogSeoScore.ts`'s `topic_coverage` category remains a stub — it's advisory content
  the admin triggers on demand, not a property of the saved article content itself, so
  scoring it automatically wouldn't reflect anything the score can actually check.

**Notable finding, not specific to this feature:** this project's `tsconfig.json` has no
`"strict"` (defaults `false`). Under that setting, this repo's installed TypeScript
(5.8.3) does not reliably narrow a two-branch discriminated union
(`{ ok: true; ... } | { ok: false; ... }`) via `if (!result.ok)` / `if (result.ok)` —
confirmed by an isolated repro outside this codebase (fails without `--strict`, passes
with it). Not a mistake in this feature's code; `GeminiInsightsResult` was restructured
to a flat interface with optional fields instead (`{ ok: boolean; insights?: ...;
reason?: ...; message?: string }`), matching the flat-shape convention this codebase
already uses for `EmailSendResult` in `email.service.ts`. Worth knowing before writing
`{ ok: true; X } | { ok: false; Y }`-style unions anywhere else in this repo — either
follow the same flat-shape pattern, or use `instanceof`/class-based errors instead of
narrowing a plain-object union.

Verified: `npm run lint`, `npm test` (229 pass), `npm run test:frontend` (56 pass),
`npm run build` (client bundle confirmed key-free as above). **Not verified: live
Gemini responses.** No key in this session's `.env.local` — request building, response
parsing/validation, the `missing_key`/`invalid_response`/`api_error` failure paths, the
route's auth/validation/rate-limit, and the UI's loading/success/unavailable/error
states are all covered by tests using injected fakes, but an actual live call to Gemini
(prompt quality, real response shape, latency) has not been exercised. Needs a
post-deploy smoke test against the Vercel Production key.

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

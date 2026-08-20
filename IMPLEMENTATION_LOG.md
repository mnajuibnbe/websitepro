# Implementation Log

## 2026-08-20 — Search Console feature audit: 5 confirmed defects found and fixed

End-to-end audit of the Phase 5 Search Console integration (below), done as a separate
pass rather than assumed-correct from having just built it. Discovered all user-facing
behaviors from scratch (not just the one issue already known), tested each as a real user
would, and ran an 8-angle automated code review (correctness x3, reuse, simplification,
efficiency, altitude, CLAUDE.md/AGENTS.md conventions) against the full diff to catch what
manual reading missed.

**Confirmed and fixed:**

1. **Blog editor panel fired a live GSC query for brand-new, never-saved posts.**
   `GooglePerformancePanel` gated only on `slug`, but `AdminBlogPosts.tsx` auto-fills
   `slug` from the title the moment an admin starts typing — before the post is ever
   saved. Opening "New post" and typing a title immediately triggered a real external API
   call for a URL that never existed. Fixed by gating on `postId !== null` as well
   (`GooglePerformancePanel.tsx`), with a regression test locking in the exact scenario
   (non-null slug, null postId → still shows "Save this post first").
2. **Course performance panel 403'd for instructors.** `AdminCourseEdit.tsx` is reachable
   by both `admin` and `instructor` roles (`Permission.CREATE_COURSE`), and the file
   already had five other `{!isInstructor && ...}` gates around admin-only sections
   (Catalog curation, Featured/Bestseller, Instructor picker) — the new performance
   section was missing that same gate, so every instructor opening their own course would
   see a broken "Admin access required" error box, since the server route strictly
   requires `role === 'admin'`. Fixed by adding the same `!isInstructor` gate used
   everywhere else in that file.
3. **Editing an existing post's slug re-fired a live query on every keystroke.** Found
   independently by three review angles: `postId` is already non-null for a saved post,
   so fix #1 didn't cover it — each keystroke in the Slug field produced a new `pageUrl`,
   a cache miss, and two real `searchanalytics.query` calls, capable of approaching the
   route's 60-req/10-min limiter on a single edit. Fixed with an 800ms debounce before the
   fetch fires (`GooglePerformancePanel.tsx`).
4. **An unhandled promise rejection could hang a request indefinitely.** The route
   handler had no top-level try/catch; this app's global Express error middleware only
   catches synchronous throws, not a rejected promise from an async handler. A transient
   Supabase Auth hiccup inside `authenticateAdmin` would leave the client's fetch hanging
   until its own timeout instead of surfacing the panel's error state. Fixed by wrapping
   the handler body and converting any unexpected rejection to a clean 503
   (`search-console.routes.ts`), with a test simulating the Supabase call throwing.
5. **A mixed-case course id would silently return zero data instead of real numbers.**
   `UUID_PATTERN` validates case-insensitively but `buildPageUrl` embedded the id
   verbatim, while the site's real course URLs are always lowercase (Postgres normalizes
   `uuid` columns on output) — a differently-cased id in the address bar would build a URL
   that never matches what Search Console actually indexed. Fixed by lowercasing the
   course id in `buildPageUrl` (`searchConsole.service.ts`), with a regression test.

Also added a clarifying comment on the two-`searchanalytics.query`-calls design after the
review's "simplification" angle suggested merging them: doing so is actually wrong, not
just less clean — Search Console omits individual low-volume query rows from a dimensioned
report for privacy while still counting them in the undimensioned aggregate, so summing
only the returned query rows would undercount real totals. Left as-is with the reasoning
now written down.

**Investigated and confirmed NOT a defect, no change made:** three review angles
independently flagged that `authenticateAdmin`'s bearer-token-plus-role-check is now a
third copy-pasted instance of the exact pattern in `contact.routes.ts`/
`blog-insights.routes.ts` (both of which already comment on the same gap), and that
`GooglePerformancePanel`/`CoursePerformancePanel` are near-duplicate components whose
styling has already started to drift. Both are real code-quality observations, but
neither is broken *behavior* — extracting a shared admin-auth helper or a shared
performance-panel component would be a refactor across working code, not a fix for
something a user can observe going wrong, so left out of scope per this audit's
instructions (fix confirmed defects, don't redesign). Worth doing as deliberate follow-up
work, not bundled into a bug-fix pass.

**Verification:** loaded both panels in a real browser against a temporary, local-only
harness (`window.fetch` mocked with canned success/empty/unavailable/error responses,
mounted via a throwaway dev route, deleted immediately after) since neither real admin
login nor `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` is available in this environment and writing
a test admin account into the production Supabase project to get real auth was avoided as
an unnecessary write to live data (same precedent as Phase 3/4/5's own log entries).
Confirmed all four states render correctly with real Tailwind styling (checked computed
CSS, not just class names) and a clean console. This is real in-browser verification of
the panels' rendering and state machine, but not literal `qa-screenshots/*.png` files or a
walkthrough of the actual authenticated admin pages — those remain blocked by the same
missing credentials noted in every prior phase of this rebuild. `npm run lint`, `npm test`
(278 pass, up from 276), `npm run test:frontend` (65 pass), `npm run build` all clean
after every fix.

## 2026-08-20 — Blog SEO editor Phase 5: real Search Console performance data

Final phase of the blog SEO editor rebuild — the panels from Phases 1-4 are all
self-contained (heuristics, on-page checks, an AI proxy); this one is the first to pull
in live external data. Google Search Console access was already fully provisioned
before this session started (domain property verified, a dedicated "Restricted" service
account granted, its JSON stored in Vercel as `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`) — this
phase was purely the integration code.

- **Confirmed the current API shape before writing code**, since `siteUrl` format is the
  one thing that's easy to get subtly wrong for a Domain property: `tutiba.com` is
  verified as a Domain property (not URL-prefix), so `searchanalytics.query`'s `siteUrl`
  must be `sc-domain:tutiba.com` (no protocol) — a URL-prefix-style `https://tutiba.com/`
  would silently return zero rows rather than error. Used the current `searchconsole` v1
  namespace (`google.searchconsole('v1')`, already bundled in this project's pinned
  `googleapis@173`) over the legacy `webmasters` v3 one — same request/response shape,
  same `webmasters.readonly` scope.
- **`src/server/config/google.ts`**: added `getSearchConsoleClient()` alongside the
  existing `getDriveClient()`, same lazy-singleton-in-module-scope pattern, its own
  service account/scope (`GOOGLE_SEARCH_CONSOLE_CREDENTIALS` /
  `webmasters.readonly`) so it stays independent of the Drive integration. Extracted the
  JSON-or-base64 credential parsing both now share into `parseGoogleCredentials()` —
  identical logic, was about to be copy-pasted a second time verbatim.
- **`src/server/services/searchConsole.service.ts`** (new): `fetchPagePerformance(pageUrl)`
  issues two `searchanalytics.query` calls per page — one with no output dimensions
  (page-filtered aggregate: clicks/impressions/CTR/position) and one with
  `dimensions: ['query']` (top 10 queries driving traffic to that URL) — both filtered via
  `dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression:
  pageUrl }] }]`. Date range is the last 28 days ending 3 days ago, not "today", since GSC
  data is incomplete for the most recent 2-3 days and querying through today would read as
  a fake traffic dip. `buildPageUrl(type, identifier)` derives the exact public URL
  server-side (`/blog/{slug}` or `/course/{id}` — courses use the raw UUID in their public
  URL, not a slug, confirmed against `CourseDetail.tsx`/`generate-seo-files.mjs`) rather
  than trusting a client-supplied URL, so the admin-only proxy can't be used to probe
  arbitrary URLs against the property. Results cache in an in-memory `Map` for 6 hours
  (matches this codebase's existing `driveMetadataCache` pattern in
  `video.controller.ts` — good enough at this project's admin-only request volume);
  failures are never cached, so a transient quota/network error self-heals on the next
  visit instead of being pinned for 6 hours.
- **`src/server/routes/search-console.routes.ts`** (new, mounted at
  `/api/search-console` in both `server.ts` and `api/index.ts`): `GET /performance?
  type=blog_post&slug=...` or `?type=course&id=...`, admin-only via the same inline
  bearer-token-plus-role-check duplicated in `contact.routes.ts`/`blog-insights.routes.ts`
  (no shared `requireAdmin` helper exists yet in this codebase). Missing credentials or a
  failed API call both return 503 with a `reason` field, never a raw error message,
  matching the Gemini proxy's `missing_key`/`api_error` convention.
- **Client**: `src/services/searchConsole.service.ts` (bearer-token fetch, same shape as
  `blogInsights.service.ts`), surfaced through two read-only panels that both auto-load on
  mount (unlike the Gemini panels, this is a cheap server-cached read, not a billed
  per-click action): `GooglePerformancePanel` as a new "4. Google performance" tier in
  `SeoSidebar.tsx` (renumbered "Strengthen" from 4 to 5), and `CoursePerformancePanel` as
  a new card section in `AdminCourseEdit.tsx` (course admin has no equivalent sidebar, so
  it's a full-width section after "Course media").

Verified: `npm run lint`, `npm test` (276 pass, incl. new
`searchConsole.service.test.ts` and `search-console.routes.test.ts` — auth/validation/
caching/error-mapping all covered with an injected fake `searchanalytics.query`, no real
network calls), `npm run test:frontend` (all pass, no regressions), `npm run build`.
**Not verified live in a browser or against the real Search Console API:** this
environment has neither `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` nor admin login credentials
locally, and the property's real traffic data can only be confirmed once this deploys
where the Vercel-stored credential is actually present — same limitation noted in the
Phase 3/4 log entries above for their own live-data checks.

## 2026-08-16 — Blog editor audit: crash fix + table/Gemini bugs + UX overhaul

Real hands-on testing of the block editor (Phases 1-4) surfaced a live Sentry crash and
several other confirmed-broken or unclear areas. Investigated each with real evidence
rather than guess-and-patch, then did the requested UX pass.

**1. Fixed the "Insert image" infinite-loop crash (Sentry event
`6b1987cb94964a81917a2521edd3ed0e`, "Maximum update depth exceeded").** Root cause traced
by hand, not guessed: `useDialogA11y.ts`'s focus-trap effect depended on `[isOpen,
onClose]`, but every dialog call site (`MediaUrlDialog`, `LinkPickerDialog`) passes an
inline `onClose={() => setX(null)}` — a new function identity every render. These dialog
components are always mounted in `BlogContentEditor`'s JSX (they self-gate on `isOpen`
internally, not via conditional rendering in the parent), so they re-render every time
`BlogContentEditor` does. `@tiptap/react`'s `useEditor` re-renders its host component on
*every* ProseMirror transaction by default (`shouldRerenderOnTransaction` was never set
to `false` — confirmed in `node_modules/@tiptap/react/dist/index.js`). The loop: dialog
opens → effect focuses the URL input → parent re-renders for any reason → new `onClose`
→ effect tears down, and teardown calls `previouslyFocused?.focus()`, moving focus back
onto the Tiptap editor → focusing a contenteditable fires a DOM `selectionchange` →
ProseMirror's `DOMObserver` (`node_modules/prosemirror-view`, `connectSelection`/
`onSelectionChange`) turns that into a transaction → `useEditor` re-renders
`BlogContentEditor` → new `onClose` again → repeat, synchronously, until React's update-
depth guard throws. Fix (`useDialogA11y.ts`): read `onClose` through a ref instead of a
dependency, so the trap only sets up/tears down on real `isOpen` transitions. Breaks the
cycle at its root (no more repeated focus-steal on every parent re-render) rather than
patching a symptom.

**2. Fixed table insertion/editing.** Three independent bugs, not one:
- `sanitizeBlogContentHtml`'s attribute allowlist (`blogContentHtml.ts`) didn't include
  `colspan`/`rowspan`/`colwidth`, which `@tiptap/extension-table-cell` always emits (even
  at the default value of 1). Every `onUpdate` sanitized those attributes away, so the
  sanitized `value` passed back into `BlogContentEditor` never matched
  `editor.getHTML()`, and the `useEffect` that reconciles `value` against the live editor
  (`if (value !== current) editor.commands.setContent(...)`) replaced the *entire*
  document on every keystroke inside a table — resetting the cursor and making cell
  editing feel broken. Fixed by adding the three attributes to
  `BLOG_CONTENT_ALLOWED_ATTR`.
- The admin editor had zero CSS for `<table>`/`<th>`/`<td>` — all the block styling in
  `index.css` was scoped to `.blog-article` (the public page) only, never
  `.blog-content-editor`. A freshly inserted table rendered borderless/invisible while
  editing. Extended the existing table/th/td selectors to cover both classes, plus a
  `.selectedCell` style (prosemirror-tables' own multi-cell-selection class, previously
  unstyled) so merge/split selection is visible.
- There was no UI for row/column/merge/delete at all — the toolbar only had "Insert
  table". Added a contextual table toolbar (`BlogContentEditor.tsx`) that appears when
  `editor.isActive('table')`, wired to the Table extension's existing
  `addRowBefore/After`, `deleteRow`, `addColumnBefore/After`, `deleteColumn`,
  `mergeCells`, `splitCell`, `toggleHeaderRow`, `deleteTable` commands (all already
  present in `@tiptap/extension-table`, just never surfaced).

**3. Found and fixed the real cause of the Topic Insights 503** ("AI-assisted insights
are temporarily unavailable"). Confirmed via live Vercel function logs (`vercel logs`,
authenticated CLI, project `websitepro`) rather than assuming — the panel was already
showing the generic-failure message, not the "not configured" missing-key message, which
by itself ruled out a missing key. The actual logged error:
`{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer
available to new users. ..."}}`. Google gated that model for this project's API
key/account, unrelated to `GEMINI_API_KEY` being set correctly (it was, exactly as
described). Fixed in `gemini.service.ts`: switched the default model to
`gemini-3.5-flash-lite` (current GA flash-tier model per `ai.google.dev/gemini-api/docs/
models`) and made it overridable via a new `GEMINI_MODEL` env var, since Google gating
older model versions for existing keys is a demonstrated recurring failure mode for this
API (multiple corroborating reports on Google's own developer forum), not a one-off.
**Not verified against the live key in this sandbox** — pulling the real
`GEMINI_API_KEY` value was blocked by this environment's own safety controls (secret
exfiltration guard), so the model swap is backed by Google's current model-listing docs
and the forum evidence, not a live test call. Worth a real smoke test after deploy.

**4. Independent audit of the rest of the editor** (video/FAQ/callout/button
extensions, link picker, content-sync effect): no further bugs found. `FaqExtension`,
`CalloutExtension`, `ButtonBlockExtension`, `VideoEmbedExtension` all use self-contained
React NodeViews with their own inline styling (unlike the stock `Table` extension), so
they weren't affected by the missing `.blog-content-editor` CSS. Their `renderHTML`
output attributes are all covered by the existing sanitizer allowlist (`data-*` via
`ALLOW_DATA_ATTR`, plus `class`/`href`/`target`/`rel`), so no other silent
attribute-stripping loop exists.

**5. Hid the "Search & sharing" panel** (`AdminBlogPosts.tsx`) — SEO title/meta
description/canonical URL overrides are no longer shown or editable. Automation is
unaffected: `deriveSeoTitle`/`deriveCanonicalUrl` fallbacks (`blogSeo.ts`) were already
the behavior whenever the override fields were empty, which they now always are for new
posts (an already-set historical override on an existing post is left alone rather than
force-cleared, since there's no data-loss reason to wipe it and no requirement to).

**6. Meta description is now written by Gemini automatically.** New
`generateMetaDescription`/`buildMetaDescriptionPrompt` in `gemini.service.ts`, new `POST
/api/blog/meta-description` route (`blog-insights.routes.ts`, same admin-auth pattern as
topic-insights — extracted a shared `authenticateAdmin` helper now that two handlers
live in this file), new `fetchMetaDescription` client wrapper
(`blogInsights.service.ts`). Prompt encodes Google Search Central's actual guidance
(`developers.google.com/search/docs/appearance/snippet`: accurate/specific to the page,
~120-155 chars since Google truncates, no keyword stuffing, unique per page) *and* this
project's established anti-AI-writing-trope rules (loaded from the `copywriting` skill's
`ai-tropes.md`: no "dive into/leverage/unlock"-style verbs, no "it's not just X, it's Y",
no em dashes, no "In today's...", no rhetorical questions) so the output doesn't read as
machine-generated. Triggered automatically from `AdminBlogPosts.tsx`'s `save()` only when
publishing (not on every draft save, to avoid a billed Gemini call on every minor edit),
folded into the existing `saving` state so there's no separate "generating…" UI — a
failure silently keeps whatever `meta_description` already exists rather than blocking
the save or surfacing an error.

**7. Real cover-image upload**, replacing the URL text field. Investigated Phase 1 first:
blog posts had never had anything beyond a raw URL input — courses, however, already had
a complete, working pattern (`CourseCoverUpload.tsx` + `courseCover.ts`): client-side
resize/crop/re-encode to WebP via canvas, upload to a dedicated Supabase Storage bucket,
store only the resulting public URL (`blog_posts.cover_image_url` already has a CHECK
constraint requiring an `https://` URL, so no schema change needed). No new
account/credential required — this project already runs on Supabase. Generalized
`courseCover.ts`'s image-processing function (`processCoverImage`, parameterized by
target dimensions/byte budget) so course and blog covers share it instead of duplicating
the crop-math/progressive-quality-loop logic; added `blogCover.ts` and
`BlogCoverUpload.tsx` mirroring the course pattern. New Supabase migrations
(`20260816160000_blog_cover_upload_storage.sql`,
`20260816160100_blog_cover_cleanup_revoke_rpc_execute.sql`, applied directly to
`nhknhibsloirpffndzcd`): a `blog-covers` bucket (public read, 700KB/WebP-only, mirroring
`course-covers`), admin-only RLS on `storage.objects`, and a cleanup trigger that deletes
the old storage object when a post's cover is replaced or the post is deleted (so
replacing a cover doesn't leak orphaned blobs). `get_advisors` caught that the cleanup
trigger function was callable directly via PostgREST's `/rest/v1/rpc/` endpoint by
`anon`/`authenticated` (unlike the pre-existing course-cover equivalent, which relies on
`REVOKE ... FROM PUBLIC` alone — this project also grants default `EXECUTE` to those
roles at function-creation time, so that alone wasn't enough here); fixed with an
explicit `REVOKE EXECUTE ... FROM anon, authenticated` in the second migration.

**8. IA/UX pass on `AdminBlogPosts.tsx`/`SeoSidebar.tsx`.** Reorganized into an explicit
workflow instead of a flat, equal-weight stack: main form groups "Write" (title, slug,
excerpt, content — unchanged, still the primary focus) separately from "Cover &
publishing" (new upload + status) now that Search & sharing is gone. Sidebar regrouped
into four labeled tiers — "Plan" (search query + intent), "Check as you write" (heading
structure/readability/introduction/word count), "Search snippet preview" (new: a
read-only Google-style preview of the title/URL/description that actually ship, replacing
the old editable-looking "SEO title & description" hints panel now that there's nothing
left to edit there), and "Strengthen" (internal linking/original value/sources/duplicate
check/topic coverage — the Phase 3 content-depth tools, most useful once a real draft
exists). "Strengthen" is a native `<details>`, collapsed by default for a new/near-empty
post and open by default when resuming a post that already has content (a one-time
`useState` lazy initializer based on word count, not re-derived every render, so a
manual toggle is never fought by a re-render). **Target Search Query field:** kept, not
removed — `primaryQuery` is genuinely load-bearing (topic-insights topic, internal-link
ranking, duplicate-content comparison, and every "does the title/description/intro match
the query" check all read it, not the title), so deleting it would silently break those
features. The actual problem was that its purpose wasn't explained: relabeled "Primary
query" → "Search phrase readers would type" and added inline help copy that adapts to
state — a concrete example of title vs. query differing while it's still the untouched
auto-fill from the title, switching to a "customized" note once the admin has actually
edited it away from the title, so the explanation matches whichever state the field is
actually in.

**Verified:** `npm run lint`, `npm test` (251 pass, incl. 19 new
`blog-insights.routes.test.ts` cases for the new route/handler), `npm run test:frontend`
(59 pass, unaffected), `npm run build` (prerender + sitemap regenerate unchanged).
Confirmed live in a browser: public `/blog` and `/blog/*` pages load with zero console
errors (the CSS/sanitizer changes don't touch the public rendering path). **Not verified
live:** the admin editor UI itself (crash repro, table insert/edit, cover upload, the
sidebar redesign) — same constraint as every prior phase's log entry in this file, no
admin login credentials available in this environment. The crash and table fixes are
instead justified by tracing the actual mechanism (ProseMirror/ `@tiptap/react` source
read directly from `node_modules`), not by "tests pass."

**Pre-existing, out of scope:** `get_advisors` also flagged ~80 other `SECURITY DEFINER`
functions project-wide as directly callable via PostgREST that predate this session —
worth a dedicated pass, not fixed here.

## 2026-08-16 — Blog SEO editor Phase 4: technical SEO

Completed the "automatic SEO the writer doesn't have to think about" layer on top of
Phases 1-3 (`b22be0c`).

- **Article JSON-LD enrichment** (`src/pages/BlogPost.tsx`): `headline` now prefers the
  admin's `seo_title` override, falling back to the raw `title` — deliberately not the
  page-`<title>` value (which appends " | Tutiba Blog"), so the schema's headline keeps
  matching what actually renders as the page's H1. Added `keywords` (from
  `primary_keyword`/`secondary_keywords`, Phase 2) and `citation` (from Phase 3's
  `sources`, mapped to `CreativeWork`), both omitted entirely when empty rather than
  emitted as empty arrays. Checked for a per-post author concept before touching
  `author`: none exists anywhere in the schema (no `author_name`-shaped column or field
  across Phases 1-3) — left the existing `Organization` attribution as-is rather than
  inventing one.
- **FAQPage structured data** (`src/lib/blogFaqExtract.ts`, new): extracts
  question/answer pairs from the article's own FAQ blocks (the same
  `div[data-block="faq"] > .faq-item > (h4.faq-question, .faq-answer)` contract
  `FaqExtension.tsx`/`blogQuestionInsert.ts` already produce) via a regex scan on the
  distinctive `faq-question`/`faq-answer` classes — no DOM parser, so it stays testable
  under `npm test` like `blogProseBlocks.ts`/`blogContentSegments.ts`. Items with an
  empty answer (a question added but not yet answered) are dropped. `BlogPost.tsx`
  renders this as a **separate** top-level `FAQPage` script (`structured-data-faq`,
  alongside the existing `structured-data-article`) only when the article actually has
  FAQ blocks — matching Google's guidance for combining Article + FAQPage schemas on one
  page, and reusing the exact `Question`/`acceptedAnswer` shape `PageMeta.tsx` already
  uses for the static `/faq` page.
- **Duplicate/Similar Content Checker** (`src/lib/blogDuplicateContent.ts`,
  `src/components/blog/DuplicateContentPanel.tsx`, wired into `SeoSidebar.tsx` as a new
  `allPosts` prop sourced from `AdminBlogPosts.tsx`'s already-loaded post list — no
  extra fetch): the one piece from the original spec not yet built anywhere in this
  rebuild. Compares the draft against this site's *other* posts only (external content
  needs a paid API, explicitly out of scope). Deliberately a local word-shingle Jaccard
  similarity (5-word n-grams), not a Gemini call like Topic Coverage: this needs to
  re-check the live draft against every other post on every edit, not fire on an
  explicit "Analyze" click, so a billed per-keystroke AI call would be slow, costly, and
  silently degrade if the AI service is down. Shingle overlap requires matching runs of
  consecutive words, not just shared vocabulary, so two distinct articles sharing topic
  terminology score low while a copy-pasted-and-reworded article scores high (validated
  in `blogDuplicateContent.test.ts` with a genuinely reworded near-duplicate vs. an
  unrelated article on a different topic).

**Schema validation:** no live Rich Results Test access in this environment: checked the
enriched `Article`/new `FAQPage` output by hand against schema.org's documented
required/recommended properties (`headline`/`image`/`datePublished` present;
`dateModified`/`author`/`publisher.logo` present; `FAQPage.mainEntity[].{name,
acceptedAnswer.text}` present), and confirmed the *unenriched* fields render correctly
via the actual production build's prerendered output (`dist/blog/*/index.html` — real
`Article` JSON-LD from the three existing sample posts, none of which have
sources/keywords/FAQ blocks set, so those new fields correctly don't appear for them).

Verified: `npm run lint`, `npm test` (241 pass, incl. new `blogFaqExtract.test.ts`,
`blogDuplicateContent.test.ts`), `npm run test:frontend` (59 pass, incl. new
`DuplicateContentPanel` cases in `blog-content-depth.frontend.test.tsx`), `npm run
build` (prerender succeeds, sitemap/robots regenerate unchanged). **Not verified live in
a browser:** the admin sidebar's new Duplicate Content Checker panel and an end-to-end
FAQ-block-to-FAQPage-schema round trip — same reason as Phase 3's log entry, no admin
login credentials in this session, and inserting a test post into the production
Supabase project to work around that was avoided as an unnecessary write to live data.

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

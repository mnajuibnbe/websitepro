# Security headers

`vercel.json` sets site-wide response headers (all routes, via the `/(.*)` header
rule). Five headers are enforced; CSP is report-only.

## Enforced

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), autoplay=(self)`
  - `autoplay=(self)` is required: the homepage hero intro and the intro-video modal
    autoplay a same-origin `<video>` ([HeroSection.tsx:73](../src/components/sections/HeroSection.tsx:73),
    [IntroVideoModal.tsx:79](../src/components/video/IntroVideoModal.tsx:79)).
  - `accelerometer`, `gyroscope`, `clipboard-write`, `encrypted-media`,
    `picture-in-picture`, `web-share`, `fullscreen` are deliberately **not** restricted
    here — the YouTube/Vimeo `<iframe allow="...">` attributes in
    [VideoProviderResolver.tsx](../src/components/video/VideoProviderResolver.tsx) delegate
    those to `youtube-nocookie.com` / `player.vimeo.com`, and an explicit `(self)`
    allowlist on the top-level header would block that cross-origin delegation.

These do not touch the manual `X-Content-Type-Options` headers already set in
[document.controller.ts](../src/server/controllers/document.controller.ts) — those
apply to specific download responses and are unrelated to this site-wide rule.

## Content-Security-Policy — report-only, NOT enforced

`Content-Security-Policy-Report-Only` is set, built from the origin inventory below.
There is **no** enforced `Content-Security-Policy` header. Report-only mode logs
violations in each visitor's browser devtools without blocking anything.

```
default-src 'self';
script-src 'self' https://www.googletagmanager.com;
style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://images.unsplash.com https://nhknhibsloirpffndzcd.supabase.co;
media-src 'self' https://tutiba-video-stream.tutiba.workers.dev;
connect-src 'self' https://nhknhibsloirpffndzcd.supabase.co https://tutiba-video-stream.tutiba.workers.dev
  https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com
  https://*.ingest.sentry.io https://*.ingest.us.sentry.io;
frame-src https://www.youtube-nocookie.com https://player.vimeo.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

Origins came from grepping `src/`, `worker/`, and `.env.example` for every external
fetch/script/style/media reference (Supabase project `nhknhibsloirpffndzcd`, the
Cloudflare Worker `tutiba-video-stream.tutiba.workers.dev`, Google Fonts, GA4/gtag,
Sentry, YouTube/Vimeo embeds, `images.unsplash.com`). No OAuth popups, reCAPTCHA/
Turnstile, WASM, service workers, or Supabase Realtime (websocket) usage were found,
so they're not in the policy.

**Known gap:** the Sentry ingest host is scoped with `*.ingest.sentry.io` and
`*.ingest.us.sentry.io` because `VITE_SENTRY_DSN` is blank in this repo (env-var
only, set in Vercel). Once a real DSN is live, narrow `connect-src` to the exact
ingest host from that DSN (`https://<key>@<host>/<project>` — the `<host>` is what
belongs in the policy) instead of the wildcard.

## Reviewing violation reports (while report-only)

No reporting endpoint exists yet — creating one is an application code change, out
of scope for this task. Until one exists:

1. Open the site in a browser with devtools open (Console tab). Report-only CSP
   violations log as `[Report Only]` console warnings without blocking the resource.
2. Reproduce the main flows: homepage (hero autoplay video), course detail (trailer,
   YouTube/Vimeo embeds if any course uses them), lesson player (Google Drive /
   Cloudflare Worker stream), checkout, login/signup, admin course-cover upload.
3. Every `[Report Only]` warning is a directive that's too narrow — the resource
   still loaded, but note the blocked-by-policy directive and origin for the fix
   before promotion.

If/when a reporting endpoint is worth adding, either:
- Add `report-to`/`report-uri` pointing at Sentry's built-in security-report
  ingestion endpoint (same DSN, different path — Sentry can ingest CSP reports
  directly), or
- Add a small Vercel API route that logs `application/csp-report` POST bodies
  (e.g. to Sentry via `Sentry.captureMessage`, or to existing logging).

## Promoting report-only → enforced (do NOT do this yet)

Per `AGENTS.md`/CLAUDE.md convention: only promote after reports have come back
clean (no unexpected violations) for **at least a week** of production traffic.

1. Confirm zero unexpected `[Report Only]` console warnings / reporting-endpoint
   hits across all flows in the "Reviewing violation reports" list above, over a
   full week including at least one full checkout + video-playback cycle.
2. In `vercel.json`, rename the header key from `Content-Security-Policy-Report-Only`
   to `Content-Security-Policy` (keep the same directive value, adjusted for any
   gaps found in step 1 — e.g. the narrowed Sentry ingest host).
3. Keep `Content-Security-Policy-Report-Only` removed once `Content-Security-Policy`
   is enforced — don't run both with the same value.
4. Redeploy, then immediately re-verify the same flows in production (hero video
   autoplay, lesson video playback, YouTube/Vimeo embeds, checkout, admin course
   cover upload, GA4/Sentry still receiving events) since enforced CSP actually
   blocks violations instead of just logging them.
5. Watch Sentry/logs for a spike in playback or checkout errors immediately after
   the switch — CSP enforcement failures often surface as generic JS errors, not
   obviously CSP-shaped ones.

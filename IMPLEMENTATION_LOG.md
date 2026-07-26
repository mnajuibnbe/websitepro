# Implementation Log

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

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


## 2026-07-26 — COURSE-VISIBILITY-FIX-001

### Proven root causes

- Home and Courses filtered course `status` by `active`, while admin publication writes `published`.
- Home did not apply the existing `is_featured` field and swallowed query failures.
- Dashboard treated enrollment-query failure as zero enrollment; its widgets swallowed errors and substituted arbitrary catalogue courses for missing active enrollment data.
- No courses/enrollments SELECT policies were tracked in repository migrations; actual production RLS remains runtime evidence required.

### Changes

- Standardized public queries on `published`; Home additionally requires `is_featured=true`.
- Added distinct query error states and removed enrollment-to-catalogue fallbacks.
- Added least-privilege public published-course and own-enrollment SELECT policies without changing lesson authorization.
- Added focused visibility predicate tests and full diagnosis/runtime test documentation.

### Follow-up hardening

- Added a separate enrolled-course SELECT policy so an active student can resolve published course metadata without making private/unlisted courses public.
- Changed progress retrieval to propagate Supabase failures to the existing error states instead of silently displaying 0% progress.

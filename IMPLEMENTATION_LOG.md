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


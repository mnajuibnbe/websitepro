# Lesson Player Polish & Video Delivery Migration

Date: 2026-08-01  
Deployment status: **not deployed**. The existing Vercel video routes remain enabled and are the default fallback.

## What changed

- Learner controls now use explicit actions such as **Mark complete & continue**, **Mark lesson complete**, **Previous lesson**, and **Next lesson**.
- The tablet curriculum breakpoint is repaired: the curriculum drawer trigger remains visible until the desktop sidebar appears at `lg` widths.
- The mobile curriculum drawer and free-preview lightbox use dynamic viewport heights, clear headings, large touch targets, backdrop/Escape close behavior, scroll locking, and accessible dialog semantics.
- `worker/` contains an additive Cloudflare Worker. Vercel still performs the sensitive lesson authorization and generates the stream token. The Worker forwards the small `/api/video/token` request to Vercel, verifies the returned token for `/api/video/stream`, authenticates to the same Google Drive service account, and sends video bytes directly from Drive to the viewer.

## Exact compatibility contract

The implementation was derived from `src/server/services/token.service.ts`, `src/server/controllers/video.controller.ts`, `src/server/routes/video.routes.ts`, and `src/server/config/google.ts`.

- Token format: JWT compact serialization.
- Signing: `jsonwebtoken.sign(payload, STREAMING_TOKEN_SECRET, { expiresIn: "2h" })`; `jsonwebtoken` defaults this symmetric signing operation to **HS256**.
- Application payload: `{ "fileId": "<Google Drive file ID>", "resourceType": "video" }`.
- Registered claims added by `jsonwebtoken`: numeric `iat` and `exp`; `exp` is two hours after issuance.
- Stream authorization: the signature and time claims must be valid and `resourceType` must equal `video`. The Drive file ID comes only from the signed token.
- Google authorization: service-account JWT bearer flow with the `https://www.googleapis.com/auth/drive.readonly` scope. `GOOGLE_SERVICE_ACCOUNT_JSON` accepts the same raw-JSON or base64-encoded JSON formats as Vercel.
- Drive requests use `supportsAllDrives=true`. Metadata validates a positive size and a `video/*` MIME type. Browser `Range` requests are forwarded to Drive and returned as `206` responses with `Content-Range`, `Content-Length`, and `Accept-Ranges` headers.
- Cache behavior remains `Cache-Control: no-store`.

## Owner deployment steps

Run these steps locally from the repository; do not paste secret values into `wrangler.toml`, shell history, source files, or a `VITE_` variable.

1. Open `worker/wrangler.toml` and replace both `https://YOUR-VERCEL-DOMAIN.vercel.app` values with the exact production Vercel origin, with no trailing slash. `ALLOWED_ORIGIN` is the browser origin allowed by CORS. `TOKEN_ISSUER_BASE_URL` is where the Worker forwards token-generation requests.

2. Sign in and confirm the Cloudflare account:

   ```powershell
   cd D:\mainwebsite\worker
   npx wrangler@latest login
   npx wrangler@latest whoami
   ```

3. Set the two required encrypted Worker secrets. Use the **same values currently configured in Vercel**, entered interactively when Wrangler prompts:

   ```powershell
   npx wrangler@latest secret put STREAMING_TOKEN_SECRET
   npx wrangler@latest secret put GOOGLE_SERVICE_ACCOUNT_JSON
   ```

   `STREAMING_TOKEN_SECRET` must be identical on Vercel and Cloudflare or every Vercel-issued token will fail verification. `GOOGLE_SERVICE_ACCOUNT_JSON` may be the raw service-account JSON or the same base64 form already used by Vercel. Do not set `SUPABASE_SERVICE_ROLE_KEY` on the Worker; it is neither needed nor read.

4. Deploy manually:

   ```powershell
   npx wrangler@latest deploy
   ```

   Record the resulting URL, for example `https://tutiba-video-stream.<account-subdomain>.workers.dev`. This repository intentionally does not configure a custom domain or DNS route.

5. Test CORS and token forwarding before changing Vercel. Replace the placeholders below. Use a real published preview lesson ID for the anonymous test, or add an enrolled user's Supabase bearer token to the `Authorization` header for a protected lesson.

   ```powershell
   $workerUrl = 'https://tutiba-video-stream.<account-subdomain>.workers.dev'
   $siteOrigin = 'https://YOUR-VERCEL-DOMAIN.vercel.app'
   $lessonId = '00000000-0000-0000-0000-000000000000'
   $tokenResponse = Invoke-RestMethod -Method Post -Uri "$workerUrl/api/video/token" -Headers @{ Origin = $siteOrigin } -ContentType 'application/json' -Body (@{ lessonId = $lessonId } | ConvertTo-Json)
   Invoke-WebRequest -Method Head -Uri "$workerUrl/api/video/stream?token=$([uri]::EscapeDataString($tokenResponse.token))" -Headers @{ Origin = $siteOrigin }
   Invoke-WebRequest -Uri "$workerUrl/api/video/stream?token=$([uri]::EscapeDataString($tokenResponse.token))" -Headers @{ Origin = $siteOrigin; Range = 'bytes=0-1048575' }
   ```

   Expected results: token request `200`, HEAD `200` with a `video/*` content type and `Accept-Ranges: bytes`, and the ranged GET `206` with a valid `Content-Range`. Also test play, pause, seeking, replay, and a protected enrolled lesson in the actual browser.

6. Only after those checks pass, set the production Vercel environment variable:

   ```text
   VITE_API_BASE_URL=https://tutiba-video-stream.<account-subdomain>.workers.dev
   ```

   This is a Vite build-time variable, so redeploy the Vercel application after changing it. Do not add a trailing slash. Do not put either server secret in a `VITE_` variable.

7. Verify the production lesson player at approximately 375 px, 768 px, and desktop width. In browser network tools, `/api/video/token` and `/api/video/stream` should target the Worker URL; the token call should be small and the video response should come from Cloudflare.

## Rollback and fallback

If any production check fails, remove or blank `VITE_API_BASE_URL` in Vercel and redeploy. The client will immediately return to the existing same-origin `/api/video/token` and `/api/video/stream` routes. Those Express/Vercel routes were not removed, disabled, or changed by this phase.

Do not delete the Vercel `STREAMING_TOKEN_SECRET` or `GOOGLE_SERVICE_ACCOUNT_JSON` values after migration: Vercel still issues tokens, and the old stream route remains the planned fallback until the owner explicitly retires it.

## Cloudflare references

- [Compatibility dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Web Crypto API support](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

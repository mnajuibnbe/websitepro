# Authentication and Public Navigation Release Readiness

This checklist is the production gate for the Tutiba sign-in, registration, password-recovery, and public-navigation work. Complete it against a configured staging deployment before promoting the release.

## Automated gates

- [ ] `npm run lint`
- [ ] `npm run test:frontend`
- [ ] `npm test`
- [ ] `npm run test:quality`
- [ ] `npm run build:check`
- [ ] `npm run test:browser-smoke`
- [ ] Confirm the working tree is clean and the deployed commit matches the approved release commit.

## Supabase and deployment configuration

- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the intended production project. Never expose the service-role key in a `VITE_` variable.
- [ ] Configure the exact production origin and approved preview/staging origins in Supabase URL configuration.
- [ ] Allow the recovery destination `https://<origin>/?type=recovery`; reject unowned wildcard origins.
- [ ] Verify email confirmation is enabled or intentionally disabled and that UI behavior matches the setting.
- [ ] Review password minimums so Supabase policy and the eight-character client requirement agree.
- [ ] Verify sign-in, sign-up, and recovery rate limits and bot-abuse controls.
- [ ] Verify access-token lifetime, refresh-token rotation, session persistence, and sign-out scope.
- [ ] Send confirmation and recovery messages through an authenticated sender domain and verify SPF, DKIM, DMARC, branding, support links, and expiry copy.
- [ ] Confirm server-only secrets are present in the deployment platform and absent from browser bundles and client logs.

## Staging journeys

- [ ] Guest opens a protected course, signs in, and returns to the exact course/lesson including safe query and hash state.
- [ ] External, protocol-relative, malformed, and authentication-loop return locations resolve to the dashboard.
- [ ] Authenticated student cannot reopen sign-in or registration and returns to the dashboard.
- [ ] Authenticated administrator cannot reopen sign-in or registration and returns to the admin area.
- [ ] Invalid credentials, unconfirmed email, throttling, offline, timeout, and provider outage states show actionable messages without raw provider details.
- [ ] Registration works with email confirmation both enabled and disabled; confirmation messages never reveal another account.
- [ ] Recovery requests use account-enumeration-safe success copy. Valid, expired, reused, and malformed links each lead to the correct recovery action.
- [ ] Password changes accept the configured policy, reject mismatches, clear password fields on success, and permit sign-in with the new password.
- [ ] Sign-out success returns to sign-in. Sign-out failure keeps the user in place and creates a privacy-safe monitoring event.
- [ ] Session refresh, expiry, retry, browser back/forward, hard refresh, and two-tab sign-in/sign-out behavior are correct.

## Accessibility and responsive review

- [ ] Complete every account journey using only a keyboard at 100%, 200%, and 400% browser zoom.
- [ ] Verify headings, labels, errors, status announcements, focus order, password toggles, skip links, and drawer focus restoration with a screen reader.
- [ ] Verify the mobile drawer traps focus, closes with Escape/backdrop/route change, makes background content inert, and restores body scrolling.
- [ ] Test reduced motion, forced colors, increased text size, narrow portrait, landscape, short viewport, software keyboard, notch, and home-indicator layouts.
- [ ] Measure text, control, focus, error, disabled, hover, and active-state contrast.

## Monitoring, rollout, and rollback

- [ ] Confirm `/api/client-errors` receives fixed auth-session and sign-out failure events without email addresses, passwords, access tokens, recovery URLs, or provider internals.
- [ ] Dashboard authentication success rate, categorized failure rate, latency, recovery-email delivery, confirmation completion, and client-error volume.
- [ ] Establish alert thresholds for a sustained increase in failures, timeouts, throttling, or email-delivery problems.
- [ ] Roll out progressively when supported and monitor the first production cohort before full promotion.
- [ ] Record the previous stable deployment and database/auth configuration. Roll back the application immediately for navigation or form regressions; revert identity-provider configuration only through reviewed configuration history.
- [ ] After release, execute the critical sign-in, protected return, recovery, and sign-out journeys on production using dedicated test accounts.

## Evidence to attach to the release

- Automated command output and deployed commit SHA.
- Desktop and mobile screenshots for login, registration, recovery, and navigation states.
- Keyboard and screen-reader review notes.
- Supabase URL, email, password, rate-limit, and session configuration review confirmation (without secret values).
- Monitoring dashboard and rollback owner links.

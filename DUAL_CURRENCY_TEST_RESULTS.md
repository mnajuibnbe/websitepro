# Dual Currency Test Results

## Automated coverage

Pricing unit tests cover EG/EGP, international/USD, missing-country USD, free display, unavailable regional price, profile-over-header priority, Vercel header resolution, and exact decimal-to-minor-unit conversion. Existing catalogue, visibility, server environment, and video tests remain in the suite. SQL verification checks both columns and order RLS shape.

## Vercel Preview procedure

1. Apply the migration to a non-production Supabase project and backfill two Preview-only published courses (one paid, one free). Configure Preview `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`, plus the already-required streaming/Google variables. No new pricing variable is required.
2. Deploy a Vercel Preview. Vercel supplies `x-vercel-ip-country` to the serverless request; confirm it in the Network response from `/api/pricing/context` (the API does not echo raw headers). Do not set/spoof that header from application code.
3. For Egypt, use an Egyptian network/VPN and an account without trusted country app metadata. Confirm context is `EGP`, source `vercel-header`; inspect Home, Courses, Details, and Checkout.
4. For International while physically in Egypt, use a reputable non-Egypt VPN against the same Preview with an account lacking country app metadata. This tests Vercel geolocation without altering data or bypassing validation. Confirm USD on all surfaces and server-created USD order.
5. To test profile precedence, an authorized backend operator sets Supabase Auth `app_metadata.billing_country` to `EG` or a non-EG ISO code, refreshes the session, and confirms source `profile` overrides the network. Never use editable `user_metadata`.
6. No persisted display choice exists. If an earlier experimental key exists, clear Preview origin storage in DevTools → Application → Storage → Clear site data; this implementation reads no local-storage currency key.
7. In DevTools Network, inspect POST `/api/checkout`: request body contains only `courseId`. In Supabase Table Editor/SQL as an authorized operator, inspect `course_orders` and confirm course/user, captured amount/currency/region/source, statuses, and timestamp. Change the course afterward and confirm the order snapshot does not change.
8. Repeat with a missing regional field and expect HTTP 409 plus the controlled unavailable UI. Attempt to add fake `amount`/`currency` fields and verify the stored order still uses the database value.

No real Vercel Preview, Supabase migration, payment charge, or regional request was available in the local run; those behaviors remain unproven until these steps produce runtime evidence.

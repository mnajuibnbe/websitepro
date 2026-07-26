# Pricing Architecture

Course catalogue prices are independent `courses.price_egp` and `courses.price_usd` decimal values. `src/lib/pricing.ts` is the sole selection/formatting domain utility. The browser obtains a display context from `GET /api/pricing/context`; it never derives country from language.

The server resolver prioritizes authenticated, trusted Supabase `app_metadata.billing_country` (then `app_metadata.country`), followed by Vercel's `x-vercel-ip-country`, then USD. User metadata and request-body country/currency are ignored. No selector existed, so a persisted-choice layer is not currently active.

`POST /api/checkout` accepts only a course ID, authenticates the bearer token, reloads the published course using the server-only service role, resolves region again, selects exactly one authoritative column, validates decimal minor units without floating-point arithmetic, snapshots the order, then creates the corresponding enrollment state. Client amount and currency are ignored.


# Pricing Migration and Backfill

Apply `supabase/migrations/20260726050000_dual_currency_pricing.sql`. It adds nullable `NUMERIC(12,2)` fields, nonnegative checks, a `NOT VALID` publishing check (which protects new/changed rows without rejecting existing legacy published rows), `course_orders`, RLS, and the dual-price Admin creation RPC.

## Required production backfill

1. Export every course ID/title/status plus legacy `price`, `price_egp`, and `price_usd` for review.
2. Determine each independent EGP and USD amount from the business owner. Do **not** exchange-rate convert or assume the legacy field's currency.
3. Update each course by ID with reviewed values in a staging transaction; retain `price` unchanged.
4. Confirm every paid and free published course has both values (free means both are explicitly zero).
5. Validate `courses_published_dual_prices` only after the audit: `ALTER TABLE public.courses VALIDATE CONSTRAINT courses_published_dual_prices;`.

## Rollback

Roll back application deployment first. The additive columns/table can safely remain. If schema rollback is mandatory, archive `course_orders`, revoke the new RPC/policies, and drop the new constraint/RPC/table/columns only after proving no orders or dual-price writes must be retained. Never drop or rewrite legacy `price` as part of rollback.


# Dual Currency Pricing

## Previous data flow

The repository knew only generic `courses.price`. Home and Courses parsed it client-side, Course Details rendered `$` and a synthetic floating-point strike-through price, the Admin table showed legacy/garbled currency copy, and Checkout displayed hard-coded `$249/$199`. The purchase CTA directly inserted a pending enrollment. There was no order table, payment-provider call, country/currency detection, or authoritative server checkout.

## Current rule

1. Trusted authenticated `app_metadata.billing_country` or `app_metadata.country`.
2. Vercel `x-vercel-ip-country` request header.
3. Persisted choice only if a future existing selector is integrated (none currently exists).
4. USD/international default.

Only ISO `EG` selects EGP. Browser language and frontend-submitted country are never trusted. Missing regional values never cross-fallback. Zero formats as `Free`; otherwise English `EGP 1,500` / `USD 45.50` formatting is centralized.

## Checkout and manual approval

The API ignores submitted totals and currencies, selects the published course and correct regional field server-side, and stores amount/currency/region/source/status timestamps in `course_orders`. Paid orders and enrollments remain pending for the existing Admin approval flow; free orders are marked paid and enrollments active. Admin pending rows show the captured order amount rather than recalculating the course.

There was and remains no real payment-provider adapter. The checkout must not be described as a successful charge until one is integrated and runtime-tested.


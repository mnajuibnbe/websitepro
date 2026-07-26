# Project Status

## 2026-07-26

COURSE-VISIBILITY-FIX-001 is implemented in source and awaiting Vercel Preview/Supabase runtime verification. Proven publication-status mismatches, the incorrect Home featured requirement, static catalogue controls, mobile/desktop action divergence, fake pagination, false-empty student states, and pending-request decision failures are repaired. Home defaults to newest-published ordering with an optional Admin priority shared by mobile and desktop. Additive least-privilege course/enrollment SELECT and admin approve/deny policies are supplied. Production schema rows, existing dashboard policies, RPC defaults, course visibility values, and environment project alignment remain unverified; see `COURSE_VISIBILITY_DIAGNOSIS.md` and `COURSE_VISIBILITY_TEST_RESULTS.md`.

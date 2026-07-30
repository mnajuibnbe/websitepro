# Course review production rollout

The single file to apply is:

`supabase/production/APPLY_ONCE_20260730_COMPLETE_FEATURE.sql`

## Required baseline

The database must already contain the repository schema through migration `20260730000001_require_course_review_notes.sql`. The consolidated script checks for the baseline tables and stops before phase 1 when they are absent.

## Apply

1. Take a Supabase database backup.
2. Open the Supabase SQL editor for the target project.
3. Paste the complete contents of `supabase/production/APPLY_ONCE_20260730_COMPLETE_FEATURE.sql`.
4. Run it once. The six phases and postflight run in one transaction, so any error rolls the complete rollout back. Do not run individual migrations `20260730010000` through `20260730060000` as well.
5. Confirm the final postflight block succeeds.
6. Sign in as an administrator and run `select public.admin_get_workflow_health();`; every invariant-violation count should be zero except operational queues such as overdue reviews or open findings.

If the script reports that rollout has already started, stop. Do not bypass the guard; inspect `supabase_migrations.schema_migrations` and the created objects before choosing individual recovery migrations.

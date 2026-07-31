# One-script course authoring database deployment

## Run this file only

`supabase/production/DEPLOY_ONCE_COMPLETE_COURSE_AUTHORING.sql`

This is the only SQL file required **because none of the phase scripts have been run**. It contains all nine July 30 database phases and its own postflight verification in one transaction.

## Required baseline

The database must already contain the application schema through `20260730000001_require_course_review_notes.sql`. The deployment script checks the required baseline objects before making changes.

## Exact deployment steps

1. Take a Supabase database backup.
2. Open the target project in **Supabase → SQL Editor → New query**.
3. Copy the complete contents of `supabase/production/DEPLOY_ONCE_COMPLETE_COURSE_AUTHORING.sql` into the editor.
4. Select **Run** once and wait for completion.
5. Confirm the result says `COURSE AUTHORING DATABASE DEPLOYMENT COMPLETE`.
6. Deploy the application commit only after that success result.

Do **not** separately run the nine source migrations, audit SQL, verification SQL, or any earlier script from this conversation. The deployment file already includes its postflight. If it reports that the rollout has already started, stop rather than removing the guard; that means the assumption that no phase script was applied is incorrect and the database needs a partial-rollout inspection.

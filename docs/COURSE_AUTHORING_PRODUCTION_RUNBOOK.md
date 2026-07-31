# Course authoring production runbook

## Scope

This is the Phase 6 deployment procedure for the complete course authoring, review, publication, lesson media, English interface, regional pricing, and SEO release. It is a forward-only rollout: never edit or re-run migrations already recorded by the target environment.

## 1. Before touching production

1. Create and verify a restorable database backup.
2. Run `npm run test:course-authoring-production` from the exact commit being deployed.
3. Because no July 30 phase script has been applied, run only `supabase/production/DEPLOY_ONCE_COMPLETE_COURSE_AUTHORING.sql`. It includes all nine phases and the postflight in one transaction.
4. Confirm the SQL result says `COURSE AUTHORING DATABASE DEPLOYMENT COMPLETE`; do not run the source migrations or separate audit/verification scripts as well.

## 2. Staging acceptance

Complete every journey in `COURSE_AUTHORING_RELEASE_CHECKLIST.md` with separate admin, instructor, and student accounts. Record the course IDs, revision IDs, review-event IDs, video provider, detected duration, displayed EGP/USD values, and screenshots of the authoring and player results.

## 3. Deployment order

1. Put authoring/review writes into maintenance mode, but leave student playback available.
2. Apply the single database deployment script; its transaction includes the post-deployment verification.
3. Deploy the server before the browser application so the required RPC and media contracts are available first.
4. Deploy the browser application, clear only application/CDN caches, and execute the smoke journeys.
5. Re-enable authoring and review writes, then monitor workflow health and media errors.

## 4. Rollback and recovery

Do not reverse schema migrations or delete revisions, enrollments, attempts, submissions, or payment history. If application behavior regresses, roll the server and browser artifacts back together, keep the database changes, disable the affected write path, and ship a new forward-fix migration. Restore the database backup only for a confirmed destructive rollout and only under the incident procedure.

## 5. Release evidence

Archive the commit SHA, deployment identifiers, backup identifier, output from both production SQL scripts, automated gate output, manual acceptance evidence, and the operator/approver names. A release is incomplete without this evidence.

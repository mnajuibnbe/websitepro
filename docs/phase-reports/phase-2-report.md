# Phase 2 Report: Database & Content Model Foundation

Date: 2026-08-01  
Live project: `nhknhibsloirpffndzcd` (`tutiba-platform`, `eu-west-2`)  
Project status at deployment: `ACTIVE_HEALTHY`

## Outcome

Phase 2 is deployed to the live Supabase project. The deployed migration chain
contains:

- `20260801135127_database_content_model_foundation`
- `20260801135314_drop_redundant_courses_category_index`

The second migration is an advisor follow-up. The live database already had
`idx_courses_category`, so the first migration's additional partial category
index was redundant and was removed.

The repository migrations are:

- `supabase/migrations/20260801000000_database_content_model_foundation.sql`
- `supabase/migrations/20260801010000_drop_redundant_courses_category_index.sql`

No commit or push was made.

## Migration-record parity audit

The live `supabase_migrations.schema_migrations.statements` values were read back
after deployment and compared character-for-character with the two repository
migration files after normalizing only CRLF/LF and the transport-added trailing
newline. Results:

- `database_content_model_foundation`: 13,842 characters compared; first
  difference position 13,842 (end of both strings).
- `drop_redundant_courses_category_index`: 206 characters compared; first
  difference position 206 (end of both strings).

Therefore there is no SQL statement drift between the repository files and the
recorded live migrations. The initial rollback-only call used `execute_sql` and
did not persist schema changes or migration history. The final foundation change
was applied with MCP `apply_migration`, which recorded live version
`20260801135127`; the advisor cleanup was also applied with `apply_migration` and
recorded live version `20260801135314`.

## Live migration verification

`supabase/tests/database_content_model_foundation_verification.sql` completed
without raising an exception against the live database. Generated Supabase types
also confirmed the new course fields, tables, relationships, and
`get_public_courses_with_stats` RPC exist in the deployed schema.

Live checks after deployment:

- `course_reviews`: 0 initial rows.
- `payment_submissions`: 0 initial rows.
- Private `payment-proofs` bucket: 1.
- Payment-proof storage policies: 4.
- Published public courses returned by the stats RPC: 2.
- Expected published public courses from the visibility predicate: 2.
- Both returned courses currently have 3 published lessons.
- Their computed active-enrollment counts are 4 and 2.
- No approved reviews exist yet, so both computed rating and review count values
  are zero.

## Category migration report

The live preflight found:

- `Skin Care`: 4 courses, already canonical.
- `البشرة`: 1 course, mapped cleanly to `Skin Care`.
- `Learn More`: 2 courses, no unambiguous canonical mapping.

The two unmatched `Learn More` values were preserved in
`course_category_migration_issues` and their live course categories were set to
`NULL`, as designed:

- `a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d`
- `b2c3d4e5-f6a1-5b2c-9d8e-1f2a3b4c5d6e`

No source value was silently promoted into the canonical taxonomy.

The first live dry run exposed an interaction with the existing category
validation trigger: the original normalization statement touched all nonblank
categories, so the trigger rejected `Learn More` before it could be audited.
The migration was corrected to update only explicitly recognized aliases. The
complete corrected migration then passed a rollback-only live execution before
being applied.

## Supabase advisors

Advisors were run before deployment, immediately after the foundation migration,
and again after the redundant-index cleanup migration.

### Security Advisor

Baseline: 58 notices.

- 1 INFO: RLS enabled with no policy on the pre-existing enrollment backup table.
- 2 WARN: anonymous access to pre-existing security-definer functions.
- 54 WARN: authenticated access to pre-existing security-definer functions.
- 1 WARN: leaked-password protection is disabled.

Final: 60 notices. The only two new findings concern the new stats RPC:

- WARN: anonymous users can execute `get_public_courses_with_stats()` as a
  security-definer function.
- WARN: authenticated users can execute `get_public_courses_with_stats()` as a
  security-definer function.

These two findings are intentional and documented rather than suppressed. The
RPC needs definer rights to compute aggregate lesson and enrollment counts
without granting public row access to protected lesson/enrollment data. Its SQL
has a fixed `pg_catalog, public` search path, fully qualified relations, no user
input, and an explicit `status = 'published' AND visibility = 'public'`
predicate. Execution is granted only to `anon` and `authenticated`, matching the
public catalogue contract. Switching it to invoker rights would return incorrect
zero counts or require exposing protected source rows.

Remediation references supplied by the advisor:

- [Anonymous security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)

No other security findings were introduced.

### Performance Advisor

Baseline: 60 notices.

- 10 INFO: unindexed foreign keys.
- 1 INFO: table without a primary key.
- 23 INFO: unused indexes.
- 17 WARN: auth RLS initialization-plan findings.
- 9 WARN: multiple permissive policies.

Immediately after the foundation migration: 68 notices. There were no new WARN
findings. Eight newly created indexes were naturally reported as unused before
application traffic. Inspection also showed that `courses_category_idx`
duplicated the existing `idx_courses_category`, so it was removed in the second
versioned migration.

Final: 66 notices. There are still no Phase-2-created performance WARN findings.
Six new INFO findings remain for newly deployed, currently unused indexes:

- `course_reviews_user_created_idx`
- `enrollments_active_course_user_idx`
- `lessons_published_course_idx`
- `payment_submissions_status_submitted_idx`
- `payment_submissions_order_submitted_idx`
- `payment_submissions_reviewer_idx`

They support review ownership/history, the public aggregate query, manual-payment
review queues, order histories, and reviewer lookups. The underlying tables are
empty or very small immediately after deployment, so zero index scans are
expected. They should be reassessed after production traffic rather than removed
at schema creation time.

[Unused-index advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

## Build result

`npm run build` passed end to end with exit code 0:

- Vite transformed 1,920 modules and completed the production client build.
- esbuild produced `dist/server.cjs` and its source map.

The command was run through a temporary npm CLI because `npm.cmd` is not on this
desktop runtime's PATH; the executed package script was exactly the repository's
`vite build && esbuild ...` script. No pnpm project files were produced or kept.

## Catalog test failure analysis

The earlier failure was not in the category assertions. It occurred on the
third assertion, which filters for `level = beginner` and `price = paid`.

The fixture set legacy `price = 199` but inherited `price_usd = 0`. Since the
default pricing context is international/USD, `filterAndSortCourses` correctly
used `price_usd`, classified the fixture as free, and returned no paid courses.
Neither `courseCatalog.ts` nor `pricing.ts` was changed by Phase 2, and database
category normalization cannot affect this in-memory price decision.

The stale fixture now sets `price_usd = 199`. It also includes the three new
course-content arrays required by the synchronized `Course` type. Results:

- Catalog and course-visibility tests: 4 passed, 0 failed.
- The Arabic legacy category assertions continue to pass, confirming the failure
  was unrelated to category normalization.

## pnpm metadata explanation

`pnpm-lock.yaml` and `pnpm-workspace.yaml` are not tracked in `HEAD` and are not
part of this branch's ancestry. Git history shows them only in the unrelated
`feature-setup` branch (`ae38352` is not an ancestor of the current branch).

The bundled validation runner temporarily generated new untracked copies in this
working tree. Those generated copies were removed. Nothing tracked was deleted,
and restoring the files from another branch would introduce unrelated package
manager configuration into Phase 2.

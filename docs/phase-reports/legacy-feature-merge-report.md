# Legacy Feature Merge Report

Date: 2026-08-01

Branch state: merge in progress; no commit or push performed

Supabase project checked: `nhknhibsloirpffndzcd` (`tutiba-platform`, `eu-west-2`)

## Outcome

The two manual conflicts were resolved with both lines of work preserved:

- Phase 1 remains the page-shell authority through `PageContainer` and the
  permanent English/LTR directional-icon convention.
- The incoming instructor course-review workflow remains the functional
  authority for queue loading, immutable revision review, readiness checks,
  review claiming, findings, decision validation, confirmation, publication,
  and failure recovery.

No database migration was applied and no live data was changed during this
merge audit.

## Manual conflict resolution

### `src/pages/admin/AdminCourseReviews.tsx`

The incoming queue implementation was retained in full, including:

- `admin_list_course_reviews` search and refresh data flow;
- accessible loading, error, retry, and empty states;
- assignee, open-finding, submission, and due-date metadata;
- links into the dedicated per-course review workspace; and
- responsive queue controls.

The old raw `px-4`/`mx-auto` page shell was replaced by Phase 1's
`PageContainer`. The intentional inner `max-w-5xl` reading constraint remains
inside that canonical page grid. `ExternalLink` continues to describe opening
the workspace and does not conflict with the LTR back/forward convention.

### `src/pages/admin/AdminCourseReviewWorkspace.tsx`

The incoming workspace implementation was retained in full, including:

- loading the immutable review workspace with readiness, findings, and history;
- claiming and releasing a review;
- creating categorized warning/blocking findings;
- resolving open findings;
- preventing approval when readiness fails or blocking findings remain open;
- required actionable decision notes and accessible validation feedback;
- a confirmation dialog for approve, request-changes, and reject decisions;
- duplicate decision-submit protection through `decidingRef`;
- RPC error recovery with workspace reload; and
- successful approval/publication navigation back to the queue.

The raw horizontal wrapper was replaced with `PageContainer`. The back action
continues to use a left-pointing `ArrowLeft`, matching Phase 1's permanent LTR
icon contract.

Comparison against the incoming conflict stages showed no business-logic or
data-flow differences beyond the `PageContainer` import and wrapper changes.

## Auto-merged application files

The requested already-merged files were read and checked against their live
dependencies:

- `AdminUserManagement.tsx` retains the server-side student list and detailed
  course-workspace RPC flows (`admin_list_students` and
  `admin_get_student_course_workspace`), including progress, access, payment,
  and activity presentation.
- `AdminLessonEditor.tsx` retains canonical `section_id`/`content_type` writes,
  PDF settings, preview settings, and verified video metadata behavior. The
  referenced columns exist in the current schema with the expected types.
- `AdminDashboard.tsx` retains live workflow-health loading through
  `admin_get_workflow_health` and the review-queue link.
- `AdminCourseBuilder.tsx` retains deep-linked authoring tabs used by readiness
  remediation (`?tab=pricing`, `?tab=curriculum`, and `?tab=publish`) and uses
  the current course/section/lesson relations.
- `AdminCourseCreate.tsx` and `AdminCourseEdit.tsx` retain the shared review
  minimums for course summary and full description. Their dual-price create and
  publication RPC signatures exist in the live schema.
- `courseReadiness.ts` retains the shared readiness contract and target URL
  mapping. Its unit tests pass.
- `PdfLessonRenderer.tsx` retains authenticated document-token acquisition,
  retry/error handling, embedded rendering, and safe new-tab access. The
  corresponding document-controller tests pass.
- `google-drive-file.service.ts` retains strict HTTPS Google Drive/Docs file-ID
  parsing and rejects folders, malformed URLs, and non-Google hosts. Its tests
  pass.

All of these files compile with the merged Phase 1 layout changes and the Phase
2 course content fields (`learning_outcomes`, `requirements`, and
`target_audience`) present in the current database.

## July 31 migration audit

All eight July 31 repository migration bodies match the corresponding live
`supabase_migrations.schema_migrations.statements` values character-for-
character after normalizing CRLF/LF and trailing newlines:

| Repository migration | Live recorded version | SQL parity |
| --- | --- | --- |
| `20260731135120_phase_zero_course_review_contract.sql` | `20260731140452` | Exact |
| `20260731140635_course_authoring_security_performance_hardening.sql` | `20260731140828` | Exact |
| `20260731141221_instructor_review_policy_hardening.sql` | `20260731141246` | Exact |
| `20260731152612_allow_admin_finalize_instructor_courses.sql` | `20260731152737` | Exact |
| `20260731153815_admin_student_course_workspace.sql` | `20260731154607` | Exact |
| `20260731154954_normalize_course_revision_workflow_fields.sql` | `20260731155050` | Exact |
| `20260731155248_enforce_review_immutability_and_recovery.sql` | `20260731155350` | Exact |
| `20260731173000_require_published_parent_sections.sql` | `20260731161601` | Exact |

The live versions differ from repository filename timestamps because the MCP
recorded deployment-time versions, as also documented for Phase 2. The SQL
bodies have no drift.

Live schema verification confirmed:

- Postgres `17.6.1.147`; project status `ACTIVE_HEALTHY`;
- all review, readiness, student-workspace, authoring, and publication RPCs used
  by the audited files exist with matching parameter signatures;
- anonymous execution is revoked for the authenticated review and authoring
  RPCs checked;
- review/audit/course/section/lesson tables have RLS enabled;
- content-mutation lock triggers cover insert, update, and delete on courses,
  sections, and lessons; and
- there are no submitted courses without a submitted revision and no
  `in_review`/`submitted` status mismatches.

One existing live data warning remains: one published course has no
`approved_revision_id`. This predates this conflict resolution and is visible
through workflow-health checks. It was not repaired because the request did not
authorize production data mutation.

## Advisor status

The current Supabase advisors were re-run after the read-only verification.

- Security: 60 notices (59 WARN, 1 INFO). The advisor now generically flags
  callable `SECURITY DEFINER` functions. The audited privileged workflow RPCs
  revoke anonymous execution, pin their search paths, and contain the expected
  admin/user authorization checks; no merge change weakened those controls.
- Performance: 66 notices (26 WARN, 40 INFO). Relevant existing notices include
  unused indexes on the newly deployed/small review tables and unrelated legacy
  RLS/index findings. No schema change was made in this merge, so these are
  recorded for follow-up rather than modified here.

Advisor remediation references:

- [Security-definer execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
- [RLS initialization plans](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)

## Verification results

- TypeScript (`tsc --noEmit`): passed.
- Configured `test` suite: 38 passed, 0 failed.
- Frontend test suite: 26 passed, 0 failed.
- Vite production client build: passed; 1,923 modules transformed.
- Server esbuild bundle: passed; `dist/server.cjs` and source map produced.
- `git diff --check`: passed after resolving the files.

The desktop runtime did not provide `npm.cmd`. The exact command bodies from
the repository's `lint`, `test`, and `build` scripts were therefore executed
directly with the bundled Node runtime; the package-manager wrapper was not
used to alter dependencies.

## Current status

The manual resolution is complete, the requested feature paths are intact, the
merged code compiles and tests/builds successfully, and the database contract
matches the deployed July 31 and Phase 2 schema. The only unresolved operational
item found is the single legacy published course without an approved revision.
No commit, push, deployment, migration, or production data repair was performed.

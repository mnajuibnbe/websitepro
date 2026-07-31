import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
const migrationDirectoryPath = fileURLToPath(migrationDirectory);
const allMigrationFiles = (await readdir(migrationDirectory)).filter(file => /^\d{14}_.+\.sql$/.test(file)).sort();
const files = allMigrationFiles.filter(file => /^20260728\d{6}_.+\.sql$/.test(file));
const expected = [
  '20260728000000_course_authoring_foundation.sql',
  '20260728010000_course_management_correctness.sql',
  '20260728020000_course_editor_taxonomy.sql',
  '20260728030000_media_duration_pipeline.sql',
  '20260728035000_instructor_role_enum.sql',
  '20260728040000_instructor_workflow.sql',
  '20260728050000_quiz_builder_and_attempts.sql',
  '20260728060000_assignment_workflow.sql',
  '20260728070000_course_review_and_publication.sql',
  '20260728080000_instructor_authoring_repair.sql',
  '20260728090000_instructor_authoring_function_repair.sql',
  '20260728100000_admin_instructor_application_list.sql',
];
const errors = [];
for (const file of expected) if (!files.includes(file)) errors.push(`Missing migration: ${file}`);
const timestamps = allMigrationFiles.map(file => file.slice(0, 14));
for (const timestamp of new Set(timestamps)) if (timestamps.filter(value => value === timestamp).length > 1) errors.push(`Duplicate migration timestamp: ${timestamp}`);
const sql = (await Promise.all(expected.map(file => readFile(join(migrationDirectoryPath, file), 'utf8')))).join('\n');
for (const name of ['admin_upsert_lesson','get_public_course_curriculum','admin_set_enrollment_access','admin_set_lesson_video_metadata','submit_instructor_application','admin_list_instructor_applications','author_save_quiz','start_quiz_attempt','author_save_assignment','submit_assignment','submit_course_for_review','admin_set_course_publication']) {
  if (!new RegExp(`(?:FUNCTION|function)\\s+public\\.${name}\\b`).test(sql)) errors.push(`Required RPC is absent: ${name}`);
}
for (const invariant of ["content_type IN ('video', 'pdf', 'external_link', 'quiz', 'assignment')", "status IN ('submitted','needs_revision','graded')", "Course approval is required before publication"]) if (!sql.includes(invariant)) errors.push(`Required invariant is absent: ${invariant}`);
for (const invariant of ["ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'instructor'", 'public.can_author_course(p_course_id)', "NOTIFY pgrst, 'reload schema'"]) if (!sql.includes(invariant)) errors.push(`Required repair is absent: ${invariant}`);
const lifecycleMigration = await readFile(join(migrationDirectoryPath, '20260730010000_course_revision_lifecycle.sql'), 'utf8').catch(() => '');
for (const invariant of ['CREATE TABLE public.course_revisions', 'submitted_revision_id', 'approved_revision_id', 'course_snapshot', 'Course changed after submission']) if (!lifecycleMigration.includes(invariant)) errors.push(`Revision lifecycle invariant is absent: ${invariant}`);
const readinessMigration = await readFile(join(migrationDirectoryPath, '20260730020000_course_readiness_and_concurrency.sql'), 'utf8').catch(() => '');
for (const invariant of ['policy_version', 'lock_course_workflow', 'trg_lessons_workflow_lock', "video_metadata_status IS DISTINCT FROM 'ready'", 'Course is no longer ready for approval', 'Course is no longer ready for publication']) if (!readinessMigration.includes(invariant)) errors.push(`Readiness/concurrency invariant is absent: ${invariant}`);
const instructorLifecycleMigration = await readFile(join(migrationDirectoryPath, '20260730030000_instructor_lifecycle_governance.sql'), 'utf8').catch(() => '');
for (const invariant of ['instructor_application_events', 'Instructor transition is not allowed', "p_decision='suspended'", "status='published'", "raw_app_meta_data"]) if (!instructorLifecycleMigration.includes(invariant)) errors.push(`Instructor lifecycle invariant is absent: ${invariant}`);
const reviewerWorkspaceMigration = await readFile(join(migrationDirectoryPath, '20260730040000_reviewer_workspace.sql'), 'utf8').catch(() => '');
for (const invariant of ['course_review_findings', 'admin_claim_course_review', 'already assigned to another administrator', 'admin_get_course_review_workspace', 'p_cursor TIMESTAMPTZ']) if (!reviewerWorkspaceMigration.includes(invariant)) errors.push(`Reviewer workspace invariant is absent: ${invariant}`);
const coverMigration = await readFile(join(migrationDirectoryPath, '20260730050000_course_cover_optimization.sql'), 'utf8').catch(() => '');
for (const invariant of ['file_size_limit=716800', "allowed_mime_types=ARRAY['image/webp']", 'Authors delete own course covers', 'cleanup_replaced_course_cover']) if (!coverMigration.includes(invariant)) errors.push(`Course-cover invariant is absent: ${invariant}`);
const operationsMigration = await readFile(join(migrationDirectoryPath, '20260730060000_workflow_operations.sql'), 'utf8').catch(() => '');
for (const invariant of ['admin_get_workflow_health', 'published_without_approved_revision', 'admin_get_workflow_metrics', 'course-review-production-v1']) if (!operationsMigration.includes(invariant)) errors.push(`Operations invariant is absent: ${invariant}`);
const integrityMigration = await readFile(join(migrationDirectoryPath, '20260730070000_authoring_data_integrity_foundation.sql'), 'utf8').catch(() => '');
for (const invariant of ['Authoring integrity preflight failed', 'authoring-data-integrity-v1', 'Deprecated compatibility column', 'Section reorder must include every active course section exactly once', 'Lesson reorder must include every active section lesson exactly once', 'author_save_quiz(uuid,jsonb)', 'author_save_assignment(uuid,jsonb)']) if (!integrityMigration.includes(invariant)) errors.push(`Authoring integrity invariant is absent: ${invariant}`);
const autoPublicationMigration = await readFile(join(migrationDirectoryPath, '20260730080000_review_auto_publication.sql'), 'utf8').catch(() => '');
for (const invariant of ['admin_finalize_course_for_review', 'review-auto-publication-v1', "status=CASE WHEN p_decision='approved' THEN 'published'", 'Published automatically after approval', 'Complete every readiness check before finalizing']) if (!autoPublicationMigration.includes(invariant)) errors.push(`Review auto-publication invariant is absent: ${invariant}`);
const seoMigration = await readFile(join(migrationDirectoryPath, '20260730090000_english_and_course_seo.sql'), 'utf8').catch(() => '');
for (const invariant of ['english-pricing-seo-v1', 'generate_course_seo_title', 'generate_course_seo_description', 'trg_courses_seo_defaults']) if (!seoMigration.includes(invariant)) errors.push(`English/pricing/SEO invariant is absent: ${invariant}`);
const phaseZeroMigration = await readFile(join(migrationDirectoryPath, '20260731135120_phase_zero_course_review_contract.sql'), 'utf8').catch(() => '');
for (const invariant of ['admin_audit_logs', 'record_authoring_audit_event', "'allowed_actions'", 'get_course_readiness_v2_internal', 'REVOKE EXECUTE ON FUNCTION public.submit_course_for_review']) if (!phaseZeroMigration.includes(invariant)) errors.push(`Phase-zero review invariant is absent: ${invariant}`);
const securityMigration = await readFile(join(migrationDirectoryPath, '20260731140635_course_authoring_security_performance_hardening.sql'), 'utf8').catch(() => '');
for (const invariant of ['anon', 'assignment_definitions_course_id_idx', 'Authenticated users view accessible courses', 'Authorized users view course review history']) if (!securityMigration.includes(invariant)) errors.push(`Authoring security invariant is absent: ${invariant}`);
const instructorPolicyMigration = await readFile(join(migrationDirectoryPath, '20260731141221_instructor_review_policy_hardening.sql'), 'utf8').catch(() => '');
for (const invariant of ['can_author_course', 'instructor_application_events_actor_id_idx', 'Authorized users view instructor applications']) if (!instructorPolicyMigration.includes(invariant)) errors.push(`Instructor policy invariant is absent: ${invariant}`);
const adminFinalizeMigration = await readFile(join(migrationDirectoryPath, '20260731152612_allow_admin_finalize_instructor_courses.sql'), 'utf8').catch(() => '');
for (const invariant of ['admin_finalize_course_for_review', "SET search_path=''", 'Admin access required', 'GRANT EXECUTE ON FUNCTION public.admin_finalize_course_for_review(UUID,TEXT) TO authenticated']) if (!adminFinalizeMigration.includes(invariant)) errors.push(`Admin finalization contract invariant is absent: ${invariant}`);
if (adminFinalizeMigration.includes('administrator-owned draft')) errors.push('Admin finalization must not require the administrator to own an instructor course.');
const studentWorkspaceMigration = await readFile(join(migrationDirectoryPath, '20260731153815_admin_student_course_workspace.sql'), 'utf8').catch(() => '');
for (const invariant of ['admin_list_students', 'admin_get_student_course_workspace', "SET search_path = ''", 'Admin access required', 'REVOKE ALL ON FUNCTION public.admin_get_student_course_workspace(UUID) FROM PUBLIC, anon', "NOTIFY pgrst, 'reload schema'"]) if (!studentWorkspaceMigration.includes(invariant)) errors.push(`Admin student workspace invariant is absent: ${invariant}`);
const revisionNormalizationMigration = await readFile(join(migrationDirectoryPath, '20260731154954_normalize_course_revision_workflow_fields.sql'), 'utf8').catch(() => '');
for (const invariant of ['review_assignee_id', 'review_claimed_at', 'review_due_at', 'Stored course revision integrity check failed', "SET search_path = ''"]) if (!revisionNormalizationMigration.includes(invariant)) errors.push(`Revision normalization invariant is absent: ${invariant}`);
const reviewImmutabilityMigration = await readFile(join(migrationDirectoryPath, '20260731155248_enforce_review_immutability_and_recovery.sql'), 'utf8').catch(() => '');
for (const invariant of ['lock_course_content_mutation', 'Course editing is locked while its submitted revision is under review', "IF p_decision = 'approved' THEN", 'admin_decide_course_review', "SET search_path = ''"]) if (!reviewImmutabilityMigration.includes(invariant)) errors.push(`Review immutability invariant is absent: ${invariant}`);
if (errors.length) { console.error(`Course authoring release verification failed:\n- ${errors.join('\n- ')}`); process.exit(1); }
execFileSync(process.execPath, [fileURLToPath(new URL('./build-database-rollout.mjs', import.meta.url)), '--check'], { stdio: 'inherit' });
console.log(`Course authoring release verification passed: ${expected.length + 16} ordered migrations and 15 critical RPCs.`);

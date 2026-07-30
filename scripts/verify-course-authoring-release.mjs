import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(migrationDirectory)).filter(file => /^20260728\d{6}_.+\.sql$/.test(file)).sort();
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
const timestamps = files.map(file => file.slice(0, 14));
for (const timestamp of new Set(timestamps)) if (timestamps.filter(value => value === timestamp).length > 1) errors.push(`Duplicate migration timestamp: ${timestamp}`);
const sql = (await Promise.all(expected.map(file => readFile(join(migrationDirectory.pathname, file), 'utf8')))).join('\n');
for (const name of ['admin_upsert_lesson','get_public_course_curriculum','admin_set_enrollment_access','admin_set_lesson_video_metadata','submit_instructor_application','admin_list_instructor_applications','author_save_quiz','start_quiz_attempt','author_save_assignment','submit_assignment','submit_course_for_review','admin_set_course_publication']) {
  if (!new RegExp(`(?:FUNCTION|function)\\s+public\\.${name}\\b`).test(sql)) errors.push(`Required RPC is absent: ${name}`);
}
for (const invariant of ["content_type IN ('video', 'pdf', 'external_link', 'quiz', 'assignment')", "status IN ('submitted','needs_revision','graded')", "Course approval is required before publication"]) if (!sql.includes(invariant)) errors.push(`Required invariant is absent: ${invariant}`);
for (const invariant of ["ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'instructor'", 'public.can_author_course(p_course_id)', "NOTIFY pgrst, 'reload schema'"]) if (!sql.includes(invariant)) errors.push(`Required repair is absent: ${invariant}`);
if (errors.length) { console.error(`Course authoring release verification failed:\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Course authoring release verification passed: ${expected.length} ordered migrations and 12 critical RPCs.`);

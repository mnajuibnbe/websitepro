-- Audit (2026-08-05) found the following constraints from the schema audit already enforced:
--   enrollments_user_id_course_id_key      UNIQUE (user_id, course_id)
--   lesson_progress_user_lesson_unique     UNIQUE (user_id, lesson_id)
--   quiz_attempts_user_quiz_attempt_number_key UNIQUE (user_id, quiz_id, attempt_number)
-- The only genuine gap was enrollments.status lacking NOT NULL / CHECK enforcement.
-- Data audit confirmed zero NULL and zero out-of-range status values prior to this change.

alter table public.enrollments
  alter column status set default 'pending',
  alter column status set not null;

alter table public.enrollments
  add constraint enrollments_status_check
  check (status = any (array['pending'::text, 'active'::text, 'cancelled'::text]));

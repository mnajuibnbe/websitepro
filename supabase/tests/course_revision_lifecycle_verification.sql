-- Deployment verification for the immutable review-revision contract.
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name='course_revisions';

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='courses'
  AND column_name IN ('submitted_revision_id','approved_revision_id')
ORDER BY column_name;

SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('course_snapshot','create_course_revision','assert_course_matches_revision')
ORDER BY proname;

SELECT conname FROM pg_constraint
WHERE conrelid='public.courses'::regclass AND conname='courses_workflow_state_check';

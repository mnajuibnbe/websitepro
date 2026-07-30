-- Read-only Phase 6 deployment verification.
SELECT to_regclass('public.assignment_definitions'),to_regclass('public.assignment_submissions');
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('author_save_assignment','author_list_assignment_submissions','get_assignment_for_lesson','submit_assignment','grade_assignment') ORDER BY proname;
SELECT conname FROM pg_constraint WHERE conrelid='public.assignment_submissions'::regclass AND contype='u';

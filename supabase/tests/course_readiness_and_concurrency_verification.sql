-- Deployment verification for readiness policy v2 and workflow serialization.
SELECT public.get_course_readiness(id)->>'policy_version' AS readiness_policy_version
FROM public.courses
WHERE public.is_admin()
ORDER BY created_at DESC LIMIT 1;

SELECT tgname FROM pg_trigger
WHERE NOT tgisinternal AND tgname IN (
  'trg_courses_workflow_lock','trg_sections_workflow_lock','trg_lessons_workflow_lock',
  'trg_quizzes_workflow_lock','trg_questions_workflow_lock',
  'trg_question_options_workflow_lock','trg_assignments_workflow_lock'
) ORDER BY tgname;

SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('lock_course_workflow','lock_course_content_mutation')
ORDER BY proname;

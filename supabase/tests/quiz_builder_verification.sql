-- Read-only Phase 5 deployment verification.
SELECT to_regclass('public.quizzes') AS quizzes,
       to_regclass('public.questions') AS questions,
       to_regclass('public.question_options') AS question_options,
       to_regclass('public.quiz_attempts') AS quiz_attempts;
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('author_save_quiz','get_author_quiz','start_quiz_attempt','save_quiz_answer','submit_quiz_attempt','get_quiz_attempt_result')
ORDER BY p.proname;
SELECT conname FROM pg_constraint WHERE conrelid='public.quizzes'::regclass AND conname='quizzes_lesson_id_key';

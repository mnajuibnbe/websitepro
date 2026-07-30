SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name='instructor_application_events';

SELECT policyname FROM pg_policies
WHERE schemaname='public' AND tablename='instructor_application_events'
ORDER BY policyname;

SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('submit_instructor_application','admin_review_instructor_application')
ORDER BY proname;

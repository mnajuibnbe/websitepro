SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='courses'
AND column_name IN('review_assignee_id','review_claimed_at','review_due_at') ORDER BY column_name;

SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='course_review_findings';

SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
AND proname IN('admin_claim_course_review','admin_save_course_review_finding','admin_get_course_review_workspace') ORDER BY proname;

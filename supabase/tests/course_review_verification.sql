-- Read-only Phase 7 deployment verification.
SELECT to_regclass('public.course_review_events');
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN('get_course_readiness','submit_course_for_review','admin_decide_course_review','admin_set_course_publication','admin_list_course_reviews') ORDER BY proname;

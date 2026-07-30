SELECT release_key,applied_at FROM public.platform_feature_releases WHERE release_key='course-review-production-v1';
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN('admin_get_workflow_health','admin_get_workflow_metrics') ORDER BY proname;

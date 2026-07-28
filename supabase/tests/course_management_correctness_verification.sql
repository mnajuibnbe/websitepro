-- Read-only Phase 1 deployment verification.
SELECT proname, prosecdef
FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND proname IN ('get_public_course_curriculum', 'admin_get_course_enrollments', 'admin_set_enrollment_access');

SELECT routine_name, grantee
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('get_public_course_curriculum', 'admin_get_course_enrollments', 'admin_set_enrollment_access')
ORDER BY routine_name, grantee;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'enrollment_access_events'
ORDER BY ordinal_position;

-- Must return no rows: audit transitions match their action.
SELECT id FROM public.enrollment_access_events
WHERE (action = 'revoked' AND new_status <> 'cancelled')
   OR (action = 'reactivated' AND new_status <> 'active');

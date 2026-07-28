SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('instructor_applications', 'instructor_public_profiles');

SELECT proname, prosecdef FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public' AND proname IN (
  'submit_instructor_application', 'admin_review_instructor_application', 'admin_search_approved_instructors',
  'get_public_course_instructor', 'is_approved_instructor', 'can_author_course', 'instructor_create_course_dual'
);

-- Must return no rows: public profiles only belong to approved applications.
SELECT ip.user_id FROM public.instructor_public_profiles ip
LEFT JOIN public.instructor_applications ia ON ia.user_id = ip.user_id AND ia.status = 'approved'
WHERE ip.is_public AND ia.id IS NULL;

-- Inventory course assignments that do not point to an approved instructor.
SELECT c.id, c.instructor_id FROM public.courses c
LEFT JOIN public.instructor_applications ia ON ia.user_id = c.instructor_id AND ia.status = 'approved'
WHERE c.instructor_id IS NOT NULL AND ia.id IS NULL;

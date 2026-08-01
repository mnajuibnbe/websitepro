-- Give each API role one SELECT policy and keep the read-only admin list RPC
-- as an invoker function. The mutation RPC remains a guarded definer function.
BEGIN;

DROP POLICY IF EXISTS "Anyone can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins can view all course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Anonymous users can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Authenticated users can view permitted course categories" ON public.course_categories;

CREATE POLICY "Anonymous users can view active course categories"
  ON public.course_categories FOR SELECT TO anon
  USING (is_active);

CREATE POLICY "Authenticated users can view permitted course categories"
  ON public.course_categories FOR SELECT TO authenticated
  USING (is_active OR (SELECT public.is_admin()));

ALTER FUNCTION public.admin_list_course_categories() SECURITY INVOKER;

NOTIFY pgrst, 'reload schema';
COMMIT;

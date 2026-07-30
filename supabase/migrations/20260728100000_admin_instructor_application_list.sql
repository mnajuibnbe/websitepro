-- Give administrators one unambiguous, RLS-safe read boundary for applications.
CREATE OR REPLACE FUNCTION public.admin_list_instructor_applications()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      to_jsonb(ia) || jsonb_build_object(
        'applicant', jsonb_build_object(
          'full_name', u.full_name,
          'email', u.email
        )
      )
      ORDER BY ia.submitted_at DESC
    )
    FROM public.instructor_applications AS ia
    JOIN public.users AS u ON u.id = ia.user_id
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_instructor_applications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_instructor_applications() TO authenticated;

NOTIFY pgrst, 'reload schema';

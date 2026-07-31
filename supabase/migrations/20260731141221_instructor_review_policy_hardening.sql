BEGIN;

REVOKE EXECUTE ON FUNCTION public.can_author_course(UUID),public.has_active_enrollment(UUID),public.is_admin(),public.is_approved_instructor(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_author_course(UUID),public.has_active_enrollment(UUID),public.is_admin(),public.is_approved_instructor(UUID) TO authenticated;

CREATE INDEX IF NOT EXISTS instructor_application_events_actor_id_idx ON public.instructor_application_events(actor_id);
CREATE INDEX IF NOT EXISTS instructor_applications_reviewer_id_idx ON public.instructor_applications(reviewer_id) WHERE reviewer_id IS NOT NULL;

DROP POLICY IF EXISTS "Admins view instructor applications" ON public.instructor_applications;
DROP POLICY IF EXISTS "Applicants view own instructor application" ON public.instructor_applications;
CREATE POLICY "Authorized users view instructor applications" ON public.instructor_applications FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR user_id=(SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins view instructor history" ON public.instructor_application_events;
DROP POLICY IF EXISTS "Applicants view own instructor history" ON public.instructor_application_events;
CREATE POLICY "Authorized users view instructor application history" ON public.instructor_application_events FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS(
    SELECT 1 FROM public.instructor_applications a
    WHERE a.id=instructor_application_events.application_id AND a.user_id=(SELECT auth.uid())
  ));

NOTIFY pgrst, 'reload schema';
COMMIT;

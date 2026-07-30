-- Phase 8: production workflow health, reconciliation, and release evidence.
BEGIN;
CREATE TABLE IF NOT EXISTS public.platform_feature_releases(
  release_key TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),applied_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,details JSONB NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.platform_feature_releases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view feature releases" ON public.platform_feature_releases;
CREATE POLICY "Admins view feature releases" ON public.platform_feature_releases FOR SELECT TO authenticated USING(public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_get_workflow_health() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,storage AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  RETURN jsonb_build_object(
    'checked_at',now(),
    'published_without_approved_revision',(SELECT count(*) FROM public.courses WHERE status='published' AND (review_status<>'approved' OR approved_revision_id IS NULL)),
    'submitted_without_revision',(SELECT count(*) FROM public.courses WHERE review_status='submitted' AND submitted_revision_id IS NULL),
    'overdue_unfinished_reviews',(SELECT count(*) FROM public.courses WHERE review_status='submitted' AND review_due_at<now()),
    'open_blocking_findings',(SELECT count(*) FROM public.course_review_findings WHERE status='open' AND severity='blocking'),
    'approved_instructor_role_drift',(SELECT count(*) FROM public.instructor_applications a JOIN public.users u ON u.id=a.user_id WHERE a.status='approved' AND u.role NOT IN('instructor','admin')),
    'inactive_instructor_public_profiles',(SELECT count(*) FROM public.instructor_public_profiles p LEFT JOIN public.instructor_applications a ON a.user_id=p.user_id AND a.status='approved' WHERE p.is_public AND a.id IS NULL),
    'missing_managed_covers',(SELECT count(*) FROM public.courses c WHERE c.status='published' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='course-covers' AND COALESCE(c.cover_image,c.thumbnail,'') LIKE '%/course-covers/'||o.name))
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_workflow_metrics(p_since TIMESTAMPTZ DEFAULT now()-interval '30 days') RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  RETURN jsonb_build_object('since',p_since,'course_submissions',(SELECT count(*) FROM public.course_review_events WHERE event_type='submitted' AND created_at>=p_since),
    'course_approvals',(SELECT count(*) FROM public.course_review_events WHERE event_type='approved' AND created_at>=p_since),
    'changes_requested',(SELECT count(*) FROM public.course_review_events WHERE event_type='changes_requested' AND created_at>=p_since),
    'publications',(SELECT count(*) FROM public.course_review_events WHERE event_type='published' AND created_at>=p_since),
    'instructor_approvals',(SELECT count(*) FROM public.instructor_application_events WHERE to_status='approved' AND created_at>=p_since),
    'instructor_suspensions',(SELECT count(*) FROM public.instructor_application_events WHERE to_status='suspended' AND created_at>=p_since));
END $$;

REVOKE ALL ON FUNCTION public.admin_get_workflow_health(),public.admin_get_workflow_metrics(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_workflow_health(),public.admin_get_workflow_metrics(TIMESTAMPTZ) TO authenticated;
INSERT INTO public.platform_feature_releases(release_key,applied_by,details) VALUES('course-review-production-v1',auth.uid(),jsonb_build_object('phases',8,'migration','20260730060000')) ON CONFLICT(release_key) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;

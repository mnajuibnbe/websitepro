-- Keep the readiness contract and finalization mutation aligned: an
-- authenticated administrator may finalize any ready draft, including a draft
-- owned by an approved instructor. Ownership remains required for the separate
-- instructor submission RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_finalize_course_for_review(
  p_course_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  c public.courses;
  readiness JSONB;
  revision public.course_revisions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Admin access required';
  END IF;

  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;

  IF c.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='Course not found';
  END IF;
  IF c.authoring_status<>'draft'
    OR c.review_status NOT IN ('not_submitted','changes_requested','rejected')
    OR c.status<>'draft' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Course cannot be finalized from its current state';
  END IF;

  readiness := public.get_course_readiness(p_course_id);
  IF NOT (readiness->>'ready')::BOOLEAN THEN
    RAISE EXCEPTION USING
      ERRCODE='23514',
      MESSAGE='Complete every readiness check before finalizing',
      DETAIL=readiness::TEXT;
  END IF;

  revision := public.create_course_revision(p_course_id);
  UPDATE public.courses
  SET authoring_status='in_review',
      review_status='submitted',
      submitted_revision_id=revision.id,
      approved_revision_id=NULL,
      review_assignee_id=NULL,
      review_claimed_at=NULL,
      review_due_at=NULL,
      version=version+1,
      updated_at=now()
  WHERE id=p_course_id;

  INSERT INTO public.course_review_events(
    course_id, actor_id, event_type, notes, revision_id
  ) VALUES (
    p_course_id,
    auth.uid(),
    'submitted',
    COALESCE(NULLIF(trim(p_notes),''),'Finalized by administrator'),
    revision.id
  );

  RETURN revision.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_finalize_course_for_review(UUID,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_finalize_course_for_review(UUID,TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

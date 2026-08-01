-- Phase zero: keep authoring validation, review actions, and audit persistence aligned.
BEGIN;

CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action ~ '^[a-z][a-z0-9_]{0,63}$'),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course','course_section','lesson','curriculum_item')),
  entity_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details)='object' AND pg_column_size(details)<=16384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_logs_entity_created_idx ON public.admin_audit_logs(entity_type,entity_id,created_at DESC);
CREATE INDEX admin_audit_logs_actor_created_idx ON public.admin_audit_logs(actor_id,created_at DESC);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read authoring audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.admin_audit_logs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.admin_audit_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.record_authoring_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_course_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin() OR public.is_approved_instructor(auth.uid())) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Approved author access required';
  END IF;
  IF p_action IS NULL OR p_action !~ '^[a-z][a-z0-9_]{0,63}$' THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid audit action';
  END IF;
  IF p_entity_type IS NULL OR p_entity_type NOT IN ('course','course_section','lesson','curriculum_item') OR p_entity_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid audit entity';
  END IF;
  IF jsonb_typeof(COALESCE(p_details,'{}'::jsonb))<>'object' OR pg_column_size(COALESCE(p_details,'{}'::jsonb))>16384 THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid audit details';
  END IF;
  IF NOT public.is_admin() THEN
    v_course_id:=CASE WHEN p_entity_type='course' THEN p_entity_id ELSE NULL END;
    IF v_course_id IS NULL AND COALESCE(p_details->>'courseId','') ~* '^[0-9a-f-]{36}$' THEN v_course_id:=(p_details->>'courseId')::uuid; END IF;
    IF v_course_id IS NULL AND p_entity_type='course_section' THEN SELECT course_id INTO v_course_id FROM public.course_sections WHERE id=p_entity_id; END IF;
    IF v_course_id IS NULL AND p_entity_type='lesson' THEN SELECT course_id INTO v_course_id FROM public.lessons WHERE id=p_entity_id; END IF;
    IF v_course_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.courses WHERE id=v_course_id AND author_id=auth.uid()) THEN
      RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course owner access required';
    END IF;
  END IF;
  INSERT INTO public.admin_audit_logs(actor_id,action,entity_type,entity_id,details)
  VALUES(auth.uid(),p_action,p_entity_type,p_entity_id,COALESCE(p_details,'{}'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.record_authoring_audit_event(TEXT,TEXT,UUID,JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_authoring_audit_event(TEXT,TEXT,UUID,JSONB) TO authenticated;

-- Preserve policy v2 as an implementation detail, then enrich its result with
-- server-authoritative actions and the exact video lessons blocking submission.
ALTER FUNCTION public.get_course_readiness(UUID) RENAME TO get_course_readiness_v2_internal;
REVOKE ALL ON FUNCTION public.get_course_readiness_v2_internal(UUID) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_course_readiness(p_course_id UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  c public.courses;
  v_result JSONB;
  v_checks JSONB;
  v_invalid_video_items JSONB;
  v_ready BOOLEAN;
  v_is_admin BOOLEAN:=public.is_admin();
  v_is_owner BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.courses WHERE id=p_course_id;
  IF c.id IS NULL OR NOT (v_is_admin OR c.author_id=auth.uid()) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course access required';
  END IF;
  v_result:=public.get_course_readiness_v2_internal(p_course_id);
  v_ready:=(v_result->>'ready')::boolean;
  v_is_owner:=c.author_id=auth.uid() AND public.is_approved_instructor(auth.uid());

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',l.id,
    'label',l.title,
    'detail',CASE
      WHEN nullif(trim(l.video_url),'') IS NULL THEN 'Add a video URL.'
      WHEN l.video_metadata_status IS DISTINCT FROM 'ready' THEN 'Video metadata is not verified (' || COALESCE(l.video_metadata_status,'missing') || ').'
      ELSE 'Video duration must be greater than zero.'
    END,
    'target','curriculum'
  ) ORDER BY s.order_index,l.order_index),'[]'::jsonb)
  INTO v_invalid_video_items
  FROM public.lessons l JOIN public.course_sections s ON s.id=l.section_id
  WHERE l.course_id=c.id AND l.deleted_at IS NULL AND l.is_published
    AND s.deleted_at IS NULL AND s.is_published AND l.content_type='video'
    AND (nullif(trim(l.video_url),'') IS NULL OR l.video_metadata_status IS DISTINCT FROM 'ready' OR COALESCE(l.video_duration_seconds,0)<=0);

  SELECT jsonb_agg(CASE WHEN check_item->>'key'='content' AND jsonb_array_length(v_invalid_video_items)>0
    THEN check_item || jsonb_build_object('items',v_invalid_video_items)
    ELSE check_item END)
  INTO v_checks FROM jsonb_array_elements(v_result->'checks') AS item(check_item);

  RETURN v_result || jsonb_build_object(
    'policy_version',3,
    'checks',v_checks,
    'allowed_actions',jsonb_build_object(
      'submit',jsonb_build_object('allowed',v_is_owner AND c.status='draft' AND c.authoring_status='draft' AND c.review_status IN('not_submitted','changes_requested','rejected') AND v_ready,'reason',CASE WHEN v_ready THEN NULL ELSE 'Complete every readiness requirement.' END),
      'finalize',jsonb_build_object('allowed',v_is_admin AND c.status='draft' AND c.authoring_status='draft' AND c.review_status IN('not_submitted','changes_requested','rejected') AND v_ready,'reason',CASE WHEN c.status<>'draft' THEN 'Restore the course to draft first.' WHEN NOT v_ready THEN 'Complete every readiness requirement.' ELSE NULL END),
      'open_review',jsonb_build_object('allowed',v_is_admin AND c.review_status='submitted'),
      'unpublish',jsonb_build_object('allowed',v_is_admin AND c.status='published' AND c.review_status='approved')
    )
  );
END $$;

-- Data API privileges must be explicit; anonymous callers never need authoring RPCs.
REVOKE ALL ON FUNCTION public.get_course_readiness(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_course_readiness(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_course_for_review(UUID,TEXT),public.admin_finalize_course_for_review(UUID,TEXT),public.admin_set_course_publication(UUID,BOOLEAN),public.admin_claim_course_review(UUID,BOOLEAN),public.admin_decide_course_review(UUID,TEXT,TEXT),public.admin_get_course_review_workspace(UUID),public.admin_list_course_reviews(TEXT,INTEGER,TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_course_for_review(UUID,TEXT),public.admin_finalize_course_for_review(UUID,TEXT),public.admin_set_course_publication(UUID,BOOLEAN),public.admin_claim_course_review(UUID,BOOLEAN),public.admin_decide_course_review(UUID,TEXT,TEXT),public.admin_get_course_review_workspace(UUID),public.admin_list_course_reviews(TEXT,INTEGER,TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

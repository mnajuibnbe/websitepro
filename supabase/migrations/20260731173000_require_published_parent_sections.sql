CREATE OR REPLACE FUNCTION public.get_course_readiness(p_course_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.courses;
  v_result JSONB;
  v_checks JSONB;
  v_invalid_video_items JSONB;
  v_hidden_published_items JSONB;
  v_ready BOOLEAN;
  v_is_admin BOOLEAN:=public.is_admin();
  v_is_owner BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.courses WHERE id=p_course_id;
  IF c.id IS NULL OR NOT (v_is_admin OR c.author_id=auth.uid()) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course access required';
  END IF;
  v_result:=public.get_course_readiness_v2_internal(p_course_id);
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

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',l.id,
    'label',l.title,
    'detail','Publish the parent section or unpublish this lesson.',
    'target','curriculum'
  ) ORDER BY s.order_index,l.order_index),'[]'::jsonb)
  INTO v_hidden_published_items
  FROM public.lessons l
  JOIN public.course_sections s ON s.id=l.section_id AND s.course_id=l.course_id
  WHERE l.course_id=c.id AND l.deleted_at IS NULL AND l.is_published
    AND (s.deleted_at IS NOT NULL OR NOT s.is_published);

  SELECT jsonb_agg(CASE WHEN check_item->>'key'='content' AND jsonb_array_length(v_invalid_video_items)>0
    THEN check_item || jsonb_build_object('items',v_invalid_video_items)
    ELSE check_item END)
  INTO v_checks FROM jsonb_array_elements(v_result->'checks') AS item(check_item);

  v_checks:=v_checks || jsonb_build_array(jsonb_build_object(
    'key','publication_consistency',
    'label','Published lessons are visible',
    'complete',jsonb_array_length(v_hidden_published_items)=0,
    'detail','Every published lesson must be inside a published section.',
    'target','curriculum',
    'items',v_hidden_published_items
  ));

  SELECT NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(v_checks) AS item(check_item)
    WHERE NOT (check_item->>'complete')::boolean
  ) INTO v_ready;

  RETURN v_result || jsonb_build_object(
    'policy_version',4,
    'ready',v_ready,
    'checks',v_checks,
    'allowed_actions',jsonb_build_object(
      'submit',jsonb_build_object('allowed',v_is_owner AND c.status='draft' AND c.authoring_status='draft' AND c.review_status IN('not_submitted','changes_requested','rejected') AND v_ready,'reason',CASE WHEN v_ready THEN NULL ELSE 'Complete every readiness requirement.' END),
      'finalize',jsonb_build_object('allowed',v_is_admin AND c.status='draft' AND c.authoring_status='draft' AND c.review_status IN('not_submitted','changes_requested','rejected') AND v_ready,'reason',CASE WHEN c.status<>'draft' THEN 'Restore the course to draft first.' WHEN NOT v_ready THEN 'Complete every readiness requirement.' ELSE NULL END),
      'open_review',jsonb_build_object('allowed',v_is_admin AND c.review_status='submitted'),
      'unpublish',jsonb_build_object('allowed',v_is_admin AND c.status='published' AND c.review_status='approved')
    )
  );
END
$function$;

REVOKE ALL ON FUNCTION public.get_course_readiness(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_readiness(UUID) TO authenticated;

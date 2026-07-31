-- Phase 1: production preflight, duration compatibility, and canonical curriculum ordering.
BEGIN;
DO $$ DECLARE v_name TEXT; BEGIN
  FOREACH v_name IN ARRAY ARRAY['courses','course_sections','lessons','course_revisions','course_review_events','course_review_findings','quizzes','questions','question_options','assignment_definitions','assignment_submissions'] LOOP
    IF to_regclass('public.'||v_name) IS NULL THEN RAISE EXCEPTION 'Authoring integrity preflight failed: public.% is missing',v_name; END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lessons' AND column_name='video_duration_seconds' AND data_type='integer') THEN RAISE EXCEPTION 'Authoring integrity preflight failed: lessons.video_duration_seconds must be INTEGER'; END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lessons' AND column_name='estimated_minutes' AND data_type='integer') THEN RAISE EXCEPTION 'Authoring integrity preflight failed: lessons.estimated_minutes must be INTEGER'; END IF;
  IF to_regprocedure('public.author_save_quiz(uuid,jsonb)') IS NULL OR to_regprocedure('public.author_save_assignment(uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'Authoring integrity preflight failed: quiz and assignment author RPCs are required'; END IF;
END $$;

COMMENT ON COLUMN public.lessons.video_duration_seconds IS 'Canonical video duration in seconds. Never store display labels here.';
COMMENT ON COLUMN public.lessons.estimated_minutes IS 'Canonical estimated whole minutes, derived from media metadata.';
COMMENT ON COLUMN public.lessons.duration IS 'Deprecated compatibility column. New writes use video_duration_seconds and estimated_minutes.';

CREATE OR REPLACE FUNCTION public.admin_set_lesson_video_metadata(p_lesson_id UUID,p_video_url TEXT,p_provider TEXT,p_duration_seconds INTEGER,p_status TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_course_id UUID;
BEGIN
  SELECT course_id INTO v_course_id FROM public.lessons WHERE id=p_lesson_id AND deleted_at IS NULL AND public.can_author_course(course_id);
  IF v_course_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course author access required'; END IF;
  IF p_status NOT IN('pending','ready','unavailable','failed') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid metadata status'; END IF;
  IF p_status='ready' AND (p_duration_seconds IS NULL OR p_duration_seconds<=0) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Ready video metadata requires duration'; END IF;
  PERFORM public.lock_course_workflow(v_course_id);
  UPDATE public.lessons SET video_url=nullif(trim(p_video_url),''),video_provider=nullif(trim(p_provider),''),video_duration_seconds=CASE WHEN p_status='ready' THEN p_duration_seconds ELSE NULL END,estimated_minutes=CASE WHEN p_status='ready' THEN ceil(p_duration_seconds/60.0)::INTEGER ELSE 0 END,video_metadata_status=p_status,video_metadata_updated_at=now(),updated_at=now(),version=version+1
  WHERE id=p_lesson_id AND course_id=v_course_id AND content_type='video' AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Video lesson not found'; END IF;
  RETURN public.recalculate_course_video_duration(v_course_id);
END $$;

WITH ranked AS(SELECT id,row_number() OVER(PARTITION BY course_id ORDER BY order_index,id)-1 canonical_order FROM public.course_sections WHERE deleted_at IS NULL)
UPDATE public.course_sections s SET order_index=r.canonical_order,updated_at=now() FROM ranked r WHERE s.id=r.id AND s.order_index IS DISTINCT FROM r.canonical_order;
WITH ranked AS(SELECT id,row_number() OVER(PARTITION BY course_id,section_id ORDER BY order_index,id)-1 canonical_order FROM public.lessons WHERE deleted_at IS NULL AND section_id IS NOT NULL)
UPDATE public.lessons l SET order_index=r.canonical_order,updated_at=now(),version=version+1 FROM ranked r WHERE l.id=r.id AND l.order_index IS DISTINCT FROM r.canonical_order;

CREATE OR REPLACE FUNCTION public.admin_reorder_course_sections(p_course_id UUID,p_section_ids UUID[]) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_expected INTEGER;v_supplied INTEGER;
BEGIN
  IF NOT public.can_author_course(p_course_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course author access required'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT count(*) INTO v_expected FROM public.course_sections WHERE course_id=p_course_id AND deleted_at IS NULL;v_supplied:=COALESCE(cardinality(p_section_ids),0);
  IF v_supplied<>v_expected OR (SELECT count(DISTINCT id) FROM unnest(COALESCE(p_section_ids,ARRAY[]::UUID[])) id)<>v_supplied OR (SELECT count(*) FROM public.course_sections WHERE course_id=p_course_id AND deleted_at IS NULL AND id=ANY(COALESCE(p_section_ids,ARRAY[]::UUID[])))<>v_expected THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Section reorder must include every active course section exactly once'; END IF;
  UPDATE public.course_sections s SET order_index=u.ordinality-1,updated_at=now() FROM unnest(COALESCE(p_section_ids,ARRAY[]::UUID[])) WITH ORDINALITY u(id,ordinality) WHERE s.id=u.id AND s.course_id=p_course_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_reorder_section_lessons(p_course_id UUID,p_section_id UUID,p_lesson_ids UUID[]) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_expected INTEGER;v_supplied INTEGER;
BEGIN
  IF NOT public.can_author_course(p_course_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course author access required'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  IF NOT EXISTS(SELECT 1 FROM public.course_sections WHERE id=p_section_id AND course_id=p_course_id AND deleted_at IS NULL) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Section does not belong to course'; END IF;
  SELECT count(*) INTO v_expected FROM public.lessons WHERE course_id=p_course_id AND section_id=p_section_id AND deleted_at IS NULL;v_supplied:=COALESCE(cardinality(p_lesson_ids),0);
  IF v_supplied<>v_expected OR (SELECT count(DISTINCT id) FROM unnest(COALESCE(p_lesson_ids,ARRAY[]::UUID[])) id)<>v_supplied OR (SELECT count(*) FROM public.lessons WHERE course_id=p_course_id AND section_id=p_section_id AND deleted_at IS NULL AND id=ANY(COALESCE(p_lesson_ids,ARRAY[]::UUID[])))<>v_expected THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Lesson reorder must include every active section lesson exactly once'; END IF;
  UPDATE public.lessons l SET order_index=u.ordinality-1,updated_at=now(),version=version+1 FROM unnest(COALESCE(p_lesson_ids,ARRAY[]::UUID[])) WITH ORDINALITY u(id,ordinality) WHERE l.id=u.id AND l.course_id=p_course_id AND l.section_id=p_section_id;
END $$;

REVOKE ALL ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT),public.admin_reorder_course_sections(UUID,UUID[]),public.admin_reorder_section_lessons(UUID,UUID,UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_lesson_video_metadata(UUID,TEXT,TEXT,INTEGER,TEXT),public.admin_reorder_course_sections(UUID,UUID[]),public.admin_reorder_section_lessons(UUID,UUID,UUID[]) TO authenticated;
INSERT INTO public.platform_feature_releases(release_key,applied_by,details) VALUES('authoring-data-integrity-v1',auth.uid(),jsonb_build_object('migration','20260730070000','duration_source','numeric_metadata','lesson_types',jsonb_build_array('video','pdf','external_link','quiz','assignment'))) ON CONFLICT(release_key) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.platform_feature_releases WHERE release_key='authoring-data-integrity-v1') THEN RAISE EXCEPTION 'Authoring integrity release evidence is missing'; END IF;
  IF to_regprocedure('public.admin_set_lesson_video_metadata(uuid,text,text,integer,text)') IS NULL THEN RAISE EXCEPTION 'Canonical media metadata RPC is missing'; END IF;
  IF to_regprocedure('public.admin_reorder_course_sections(uuid,uuid[])') IS NULL OR to_regprocedure('public.admin_reorder_section_lessons(uuid,uuid,uuid[])') IS NULL THEN RAISE EXCEPTION 'Canonical ordering RPCs are missing'; END IF;
  IF to_regprocedure('public.author_save_quiz(uuid,jsonb)') IS NULL OR to_regprocedure('public.author_save_assignment(uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'Nested authoring RPCs are missing'; END IF;
  IF EXISTS(SELECT 1 FROM public.course_sections WHERE deleted_at IS NULL GROUP BY course_id,order_index HAVING count(*)>1) THEN RAISE EXCEPTION 'Active section order still contains duplicates'; END IF;
  IF EXISTS(SELECT 1 FROM public.lessons WHERE deleted_at IS NULL AND section_id IS NOT NULL GROUP BY course_id,section_id,order_index HAVING count(*)>1) THEN RAISE EXCEPTION 'Active lesson order still contains duplicates'; END IF;
END $$;
SELECT release_key,applied_at,details FROM public.platform_feature_releases WHERE release_key='authoring-data-integrity-v1';
SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='lessons' AND column_name IN('duration','estimated_minutes','video_duration_seconds') ORDER BY column_name;

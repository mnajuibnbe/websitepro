DO $$ BEGIN
 IF to_regprocedure('public.admin_finalize_course_for_review(uuid,text)') IS NULL THEN RAISE EXCEPTION 'Admin finalization RPC is missing';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.platform_feature_releases WHERE release_key='review-auto-publication-v1') THEN RAISE EXCEPTION 'Review auto-publication release evidence is missing';END IF;
 IF position($needle$status=CASE WHEN p_decision='approved' THEN 'published'$needle$ IN pg_get_functiondef(to_regprocedure('public.admin_decide_course_review(uuid,text,text)')))=0 THEN RAISE EXCEPTION 'Approval does not publish atomically';END IF;
 IF position($needle$'published','Published automatically after approval'$needle$ IN pg_get_functiondef(to_regprocedure('public.admin_decide_course_review(uuid,text,text)')))=0 THEN RAISE EXCEPTION 'Automatic publication event is missing';END IF;
END $$;
SELECT release_key,applied_at,details FROM public.platform_feature_releases WHERE release_key='review-auto-publication-v1';

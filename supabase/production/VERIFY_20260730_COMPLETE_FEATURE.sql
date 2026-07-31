-- Read-only Phase 6 post-deployment verification.
-- This deliberately does not query supabase_migrations.schema_migrations, which
-- is not present in every hosted or CLI-managed Supabase environment.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(name, ', ' ORDER BY name) INTO missing
  FROM (VALUES
    ('public.course_revisions', to_regclass('public.course_revisions') IS NOT NULL),
    ('public.course_review_findings', to_regclass('public.course_review_findings') IS NOT NULL),
    ('public.admin_finalize_course_for_review(uuid,text)', to_regprocedure('public.admin_finalize_course_for_review(uuid,text)') IS NOT NULL),
    ('public.admin_decide_course_review(uuid,text,text)', to_regprocedure('public.admin_decide_course_review(uuid,text,text)') IS NOT NULL),
    ('public.admin_set_lesson_video_metadata(uuid,text,text,integer,text)', to_regprocedure('public.admin_set_lesson_video_metadata(uuid,text,text,integer,text)') IS NOT NULL),
    ('public.generate_course_seo_title(text)', to_regprocedure('public.generate_course_seo_title(text)') IS NOT NULL),
    ('public.generate_course_seo_description(text,text,text)', to_regprocedure('public.generate_course_seo_description(text,text,text)') IS NOT NULL)
  ) required(name, installed) WHERE NOT installed;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Course authoring rollout is incomplete. Missing: %', missing; END IF;

  IF EXISTS (SELECT 1 FROM public.courses WHERE status='published' AND (review_status<>'approved' OR approved_revision_id IS NULL)) THEN
    RAISE EXCEPTION 'Integrity failure: a published course has no approved revision';
  END IF;
  IF EXISTS (SELECT 1 FROM public.courses WHERE review_status='submitted' AND submitted_revision_id IS NULL) THEN
    RAISE EXCEPTION 'Integrity failure: a submitted course has no immutable revision';
  END IF;
  IF EXISTS (SELECT 1 FROM public.lessons WHERE deleted_at IS NULL AND duration IS NOT NULL AND duration < 0) THEN
    RAISE EXCEPTION 'Integrity failure: a lesson has a negative duration';
  END IF;
  IF EXISTS (SELECT 1 FROM public.courses WHERE price_egp IS NULL OR price_usd IS NULL OR price_egp < 0 OR price_usd < 0 OR ((price_egp=0)<>(price_usd=0))) THEN
    RAISE EXCEPTION 'Integrity failure: regional course prices are incomplete or inconsistent';
  END IF;
  IF EXISTS (SELECT 1 FROM public.courses WHERE nullif(btrim(seo_title),'') IS NULL OR nullif(btrim(seo_description),'') IS NULL) THEN
    RAISE EXCEPTION 'Integrity failure: course SEO metadata is missing';
  END IF;
  IF (SELECT count(*) FROM public.platform_feature_releases WHERE release_key IN ('course-review-production-v1','authoring-data-integrity-v1','review-auto-publication-v1','english-pricing-seo-v1')) <> 4 THEN
    RAISE EXCEPTION 'Feature release evidence is incomplete';
  END IF;
END $$;

SELECT release_key, applied_at, details
FROM public.platform_feature_releases
WHERE release_key IN ('course-review-production-v1','authoring-data-integrity-v1','review-auto-publication-v1','english-pricing-seo-v1')
ORDER BY applied_at;

SELECT public.admin_get_workflow_health() AS workflow_health;

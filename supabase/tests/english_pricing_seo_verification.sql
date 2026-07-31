DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.platform_feature_releases WHERE release_key='english-pricing-seo-v1') THEN RAISE EXCEPTION 'English/pricing/SEO release evidence missing'; END IF;
 IF public.generate_course_seo_title('Course') <> 'Course | Tutiba' THEN RAISE EXCEPTION 'SEO title generator is invalid'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_courses_seo_defaults' AND NOT tgisinternal) THEN RAISE EXCEPTION 'Course SEO trigger missing'; END IF;
END $$;

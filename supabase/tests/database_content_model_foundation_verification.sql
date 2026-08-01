-- Run after 20260801000000_database_content_model_foundation.sql.
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT array_agg(required.name ORDER BY required.name)
  INTO missing_columns
  FROM (VALUES ('learning_outcomes'), ('requirements'), ('target_audience')) AS required(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses'
      AND column_name = required.name AND data_type = 'jsonb'
  );
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Missing course content columns: %', missing_columns;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_category_fkey') THEN
    RAISE EXCEPTION 'courses.category foreign key is missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.courses c
    LEFT JOIN public.course_categories cc ON cc.name = c.category
    WHERE c.category IS NOT NULL AND cc.name IS NULL
  ) THEN
    RAISE EXCEPTION 'A live course category is not canonical';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_reviews' AND rowsecurity) THEN
    RAISE EXCEPTION 'course_reviews is missing or RLS is disabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_submissions' AND rowsecurity) THEN
    RAISE EXCEPTION 'payment_submissions is missing or RLS is disabled';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_reviews') <> 4 THEN
    RAISE EXCEPTION 'Unexpected course_reviews policy count';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_submissions') <> 3 THEN
    RAISE EXCEPTION 'Unexpected payment_submissions policy count';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs' AND public = FALSE) THEN
    RAISE EXCEPTION 'Private payment-proofs bucket is missing';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%payment proof%') <> 4 THEN
    RAISE EXCEPTION 'Unexpected payment proof storage policy count';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_public_courses_with_stats'
      AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'Stats RPC is missing or not configured to aggregate protected rows';
  END IF;
END $$;

-- Operational category mismatch report. A non-empty result requires an admin
-- to select a canonical category for that course; the original value is safe.
SELECT course_id, original_category, normalized_candidate, reason, detected_at
FROM public.course_category_migration_issues
ORDER BY detected_at, course_id;

-- Run in a disposable/Preview transaction after applying migrations.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'home_order'
  ) THEN
    RAISE EXCEPTION 'Missing courses.home_order';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses' AND policyname = 'Public can view published courses') THEN
    RAISE EXCEPTION 'Missing public published-course policy';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enrollments' AND policyname = 'Students can view own enrollments') THEN
    RAISE EXCEPTION 'Missing own-enrollment policy';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enrollments' AND policyname = 'Admins can decide pending enrollments') THEN
    RAISE EXCEPTION 'Missing Admin enrollment-decision policy';
  END IF;
END $$;

ROLLBACK;

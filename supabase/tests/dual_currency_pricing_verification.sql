DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='price_egp') THEN RAISE EXCEPTION 'price_egp missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='price_usd') THEN RAISE EXCEPTION 'price_usd missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='course_orders' AND rowsecurity) THEN RAISE EXCEPTION 'course_orders RLS missing'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='course_orders' AND cmd IN ('INSERT','DELETE')) THEN RAISE EXCEPTION 'browser order creation/deletion policy must not exist'; END IF;
END $$;

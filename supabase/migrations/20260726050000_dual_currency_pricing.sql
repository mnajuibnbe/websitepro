-- Additive dual-currency pricing. Legacy courses.price is intentionally retained
-- and is not backfilled because its historical currency is not established.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS price_egp NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(12,2) NULL;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_price_egp_nonnegative;
ALTER TABLE public.courses ADD CONSTRAINT courses_price_egp_nonnegative CHECK (price_egp IS NULL OR price_egp >= 0);
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_price_usd_nonnegative;
ALTER TABLE public.courses ADD CONSTRAINT courses_price_usd_nonnegative CHECK (price_usd IS NULL OR price_usd >= 0);
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_published_dual_prices;
ALTER TABLE public.courses ADD CONSTRAINT courses_published_dual_prices
  CHECK (status <> 'published' OR (
    price_egp IS NOT NULL AND price_usd IS NOT NULL AND
    ((price_egp = 0 AND price_usd = 0) OR (price_egp > 0 AND price_usd > 0))
  )) NOT VALID;

COMMENT ON COLUMN public.courses.price_egp IS 'Independent Egypt catalogue price in EGP; NULL means unavailable.';
COMMENT ON COLUMN public.courses.price_usd IS 'Independent international catalogue price in USD; NULL means unavailable.';

CREATE TABLE IF NOT EXISTS public.course_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('EGP', 'USD')),
  pricing_region TEXT NOT NULL CHECK (pricing_region IN ('egypt', 'international')),
  pricing_source TEXT NOT NULL CHECK (pricing_source IN ('profile', 'vercel-header', 'persisted-choice', 'default')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  enrollment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN ('pending', 'active', 'cancelled')),
  provider_reference TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_orders_user_created ON public.course_orders(user_id, created_at DESC);
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own course orders" ON public.course_orders;
CREATE POLICY "Students can view own course orders" ON public.course_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view course orders" ON public.course_orders;
CREATE POLICY "Admins can view course orders" ON public.course_orders FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can update course order status" ON public.course_orders FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- No browser INSERT/DELETE policy: checkout creation writes only through the server.

CREATE OR REPLACE FUNCTION public.admin_create_course_dual(
  p_title TEXT, p_slug TEXT, p_short_description TEXT, p_description TEXT,
  p_category TEXT, p_level TEXT, p_language TEXT, p_price_egp NUMERIC,
  p_price_usd NUMERIC, p_instructor_id UUID, p_thumbnail TEXT, p_cover_image TEXT,
  p_create_first_section BOOLEAN DEFAULT TRUE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') <> 'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_price_egp IS NULL OR p_price_usd IS NULL OR p_price_egp < 0 OR p_price_usd < 0 THEN RAISE EXCEPTION 'Both non-negative regional prices are required'; END IF;
  IF (p_price_egp = 0) <> (p_price_usd = 0) THEN RAISE EXCEPTION 'A free course must have both prices set to zero'; END IF;
  INSERT INTO public.courses (title, slug, short_description, description, category, level, language, price_egp, price_usd, instructor_id, thumbnail, cover_image, status)
  VALUES (p_title, p_slug, p_short_description, p_description, p_category, p_level, p_language, p_price_egp, p_price_usd, p_instructor_id, p_thumbnail, p_cover_image, 'draft') RETURNING id INTO v_id;
  IF p_create_first_section THEN INSERT INTO public.course_sections(course_id, title, order_index, is_published) VALUES (v_id, 'Course content', 0, FALSE); END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_create_course_dual(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,UUID,TEXT,TEXT,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_course_dual(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,UUID,TEXT,TEXT,BOOLEAN) TO authenticated;

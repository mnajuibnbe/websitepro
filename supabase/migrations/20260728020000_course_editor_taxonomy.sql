-- Phase 2: governed course categories used by create/edit and catalog filters.
BEGIN;

CREATE TABLE IF NOT EXISTS public.course_categories (
  value TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.course_categories(value, label, description, order_index) VALUES
  ('Skin Care', 'Skin care', 'Skin health, products, routines, and professional treatments.', 0),
  ('Hair Care', 'Hair care', 'Hair and scalp health, products, and professional treatments.', 1),
  ('Professional Practice', 'Professional practice', 'Business, consultation, safety, and client-care skills.', 2),
  ('Cosmetic Science', 'Cosmetic science', 'Ingredients, formulation, product evaluation, and evidence.', 3)
ON CONFLICT (value) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description,
  order_index = EXCLUDED.order_index, updated_at = now();

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active course categories" ON public.course_categories;
CREATE POLICY "Anyone can view active course categories" ON public.course_categories
  FOR SELECT TO anon, authenticated USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins can manage course categories" ON public.course_categories;
CREATE POLICY "Admins can manage course categories" ON public.course_categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_course_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.category IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.course_categories WHERE value = NEW.category AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Select an active course category';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_validate_category ON public.courses;
CREATE TRIGGER trg_courses_validate_category
  BEFORE INSERT OR UPDATE OF category ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.validate_course_category();

COMMIT;

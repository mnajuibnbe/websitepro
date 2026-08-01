-- Courses catalog taxonomy: make the existing seeded taxonomy the single
-- database-backed source used by public catalog filters and admin authoring.
BEGIN;

DROP TRIGGER IF EXISTS trg_courses_validate_category ON public.courses;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_category_fkey;

ALTER TABLE public.course_categories DROP CONSTRAINT IF EXISTS course_categories_pkey;
ALTER TABLE public.course_categories RENAME COLUMN value TO name;
ALTER TABLE public.course_categories RENAME COLUMN order_index TO display_order;
ALTER TABLE public.course_categories
  ADD COLUMN id BIGINT GENERATED ALWAYS AS IDENTITY,
  ADD COLUMN slug TEXT;

UPDATE public.courses
SET category = CASE category
  WHEN 'Skin Care' THEN 'Skin care'
  WHEN 'Hair Care' THEN 'Hair care'
  WHEN 'Professional Practice' THEN 'Professional practice'
  WHEN 'Cosmetic Science' THEN 'Cosmetic science'
  ELSE category
END;

UPDATE public.course_categories
SET name = label,
    slug = CASE label
      WHEN 'Skin care' THEN 'skin-care'
      WHEN 'Hair care' THEN 'hair-care'
      WHEN 'Professional practice' THEN 'professional-practice'
      WHEN 'Cosmetic science' THEN 'cosmetic-science'
      ELSE TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(label), '[^a-z0-9]+', '-', 'g'))
    END,
    updated_at = now();

ALTER TABLE public.course_categories DROP COLUMN label;
ALTER TABLE public.course_categories
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT course_categories_pkey PRIMARY KEY (id),
  ADD CONSTRAINT course_categories_name_key UNIQUE (name),
  ADD CONSTRAINT course_categories_slug_key UNIQUE (slug),
  ADD CONSTRAINT course_categories_name_not_blank CHECK (BTRIM(name) <> ''),
  ADD CONSTRAINT course_categories_reserved_name_check CHECK (LOWER(BTRIM(name)) NOT IN ('all courses', 'free')),
  ADD CONSTRAINT course_categories_slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  ADD CONSTRAINT course_categories_display_order_check CHECK (display_order >= 0);
CREATE UNIQUE INDEX course_categories_name_lower_key
  ON public.course_categories (LOWER(BTRIM(name)));

INSERT INTO public.course_categories (name, slug, description, display_order, is_active)
VALUES
  ('Skin care', 'skin-care', 'Skin health, products, routines, and professional treatments.', 0, TRUE),
  ('Hair care', 'hair-care', 'Hair and scalp health, products, and professional treatments.', 1, TRUE),
  ('Professional practice', 'professional-practice', 'Business, consultation, safety, and client-care skills.', 2, TRUE),
  ('Cosmetic science', 'cosmetic-science', 'Ingredients, formulation, product evaluation, and evidence.', 3, TRUE)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = now();

ALTER TABLE public.courses ADD CONSTRAINT courses_category_fkey
  FOREIGN KEY (category) REFERENCES public.course_categories(name)
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.validate_course_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.category IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.course_categories
    WHERE name = NEW.category AND is_active
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Select an active course category';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_courses_validate_category
  BEFORE INSERT OR UPDATE OF category ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.validate_course_category();

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins can manage course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins can view all course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Anonymous users can view active course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Authenticated users can view permitted course categories" ON public.course_categories;
CREATE POLICY "Anonymous users can view active course categories"
  ON public.course_categories FOR SELECT TO anon
  USING (is_active);
CREATE POLICY "Authenticated users can view permitted course categories"
  ON public.course_categories FOR SELECT TO authenticated
  USING (is_active OR (SELECT public.is_admin()));

REVOKE ALL ON TABLE public.course_categories FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.course_categories TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_course_categories()
RETURNS SETOF public.course_categories
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT cc.*
  FROM public.course_categories AS cc
  ORDER BY cc.display_order, cc.name, cc.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_course_category(
  p_id BIGINT,
  p_name TEXT,
  p_display_order INTEGER,
  p_is_active BOOLEAN
)
RETURNS public.course_categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name TEXT := BTRIM(COALESCE(p_name, ''));
  v_slug TEXT;
  v_category public.course_categories;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  IF v_name = '' OR CHAR_LENGTH(v_name) > 80 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Category name must be between 1 and 80 characters';
  END IF;
  IF LOWER(v_name) IN ('all courses', 'free') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'This category name is reserved by the catalog';
  END IF;
  IF p_display_order IS NULL OR p_display_order < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Display order must be zero or greater';
  END IF;

  IF p_id IS NULL THEN
    v_slug := TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(v_name), '[^a-z0-9]+', '-', 'g'));
    IF v_slug = '' THEN
      v_slug := 'category-' || SUBSTRING(MD5(v_name) FROM 1 FOR 10);
    END IF;
    IF EXISTS (SELECT 1 FROM public.course_categories WHERE slug = v_slug) THEN
      v_slug := LEFT(v_slug, 50) || '-' || SUBSTRING(MD5(v_name) FROM 1 FOR 8);
    END IF;

    INSERT INTO public.course_categories (name, slug, description, display_order, is_active)
    VALUES (v_name, v_slug, '', p_display_order, COALESCE(p_is_active, TRUE))
    RETURNING * INTO v_category;
  ELSE
    UPDATE public.course_categories
    SET name = v_name,
        display_order = p_display_order,
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_category;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Course category not found';
    END IF;
  END IF;

  RETURN v_category;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_course_categories() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_course_category(BIGINT, TEXT, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_course_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_course_category(BIGINT, TEXT, INTEGER, BOOLEAN) TO authenticated;

COMMENT ON TABLE public.course_categories IS
  'Admin-managed source of truth for course authoring and public catalog category filters.';

NOTIFY pgrst, 'reload schema';
COMMIT;

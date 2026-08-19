BEGIN;

-- Controls which homepage body sections (below the hero) are shown and in what order.
-- Hero always renders first and is not part of this table; Newsletter keeps its own
-- separate FEATURE_FLAGS.newsletter gate and is not part of this table either.
CREATE TABLE public.homepage_section_layout (
  section_key TEXT PRIMARY KEY CHECK (section_key IN (
    'stats', 'why_choose_us', 'featured_courses', 'instructor', 'learning_method',
    'outcomes', 'testimonials', 'free_content', 'latest_articles', 'faq', 'final_cta'
  )),
  display_order SMALLINT NOT NULL UNIQUE CHECK (display_order > 0),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_section_layout IS
  'Admin-managed order and visibility of homepage body sections. Fixed set of known section keys -- no insert/delete, only reorder/toggle.';

CREATE TRIGGER set_homepage_section_layout_updated_at
  BEFORE UPDATE ON public.homepage_section_layout
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_section_layout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible sections are publicly readable" ON public.homepage_section_layout FOR SELECT TO anon USING (is_visible = TRUE);
CREATE POLICY "Authenticated users can read permitted sections" ON public.homepage_section_layout FOR SELECT TO authenticated USING (is_visible = TRUE OR (SELECT public.is_admin()));
CREATE POLICY "Admins can update section layout" ON public.homepage_section_layout FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

REVOKE ALL ON TABLE public.homepage_section_layout FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_section_layout TO anon, authenticated;
GRANT UPDATE (is_visible, display_order, updated_at, updated_by) ON TABLE public.homepage_section_layout TO authenticated;
GRANT ALL ON TABLE public.homepage_section_layout TO service_role;

INSERT INTO public.homepage_section_layout (section_key, display_order) VALUES
  ('stats', 1),
  ('why_choose_us', 2),
  ('featured_courses', 3),
  ('instructor', 4),
  ('learning_method', 5),
  ('outcomes', 6),
  ('testimonials', 7),
  ('free_content', 8),
  ('latest_articles', 9),
  ('faq', 10),
  ('final_cta', 11);

-- Same temp-slot swap technique as admin_move_legacy_testimonial / admin_move_homepage_faq_entry.
CREATE OR REPLACE FUNCTION public.admin_move_homepage_section(p_section_key TEXT, p_direction TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_order SMALLINT;
  v_neighbor_key TEXT;
  v_neighbor_order SMALLINT;
  v_temp_order SMALLINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder homepage sections';
  END IF;

  IF p_direction NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction;
  END IF;

  SELECT display_order INTO v_current_order FROM public.homepage_section_layout WHERE section_key = p_section_key;
  IF v_current_order IS NULL THEN
    RAISE EXCEPTION 'Homepage section % not found', p_section_key;
  END IF;

  IF p_direction = 'up' THEN
    SELECT section_key, display_order INTO v_neighbor_key, v_neighbor_order
    FROM public.homepage_section_layout WHERE display_order < v_current_order ORDER BY display_order DESC LIMIT 1;
  ELSE
    SELECT section_key, display_order INTO v_neighbor_key, v_neighbor_order
    FROM public.homepage_section_layout WHERE display_order > v_current_order ORDER BY display_order ASC LIMIT 1;
  END IF;

  IF v_neighbor_key IS NULL THEN
    RETURN;
  END IF;

  SELECT max(display_order) + 1 INTO v_temp_order FROM public.homepage_section_layout;

  UPDATE public.homepage_section_layout SET display_order = v_temp_order WHERE section_key = p_section_key;
  UPDATE public.homepage_section_layout SET display_order = v_current_order WHERE section_key = v_neighbor_key;
  UPDATE public.homepage_section_layout SET display_order = v_neighbor_order WHERE section_key = p_section_key;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_move_homepage_section(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_move_homepage_section(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

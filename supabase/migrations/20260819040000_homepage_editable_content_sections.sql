BEGIN;

-- ============================================================================
-- Hero section
-- ============================================================================
CREATE TABLE public.homepage_hero_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow_text TEXT NOT NULL CHECK (char_length(btrim(eyebrow_text)) BETWEEN 2 AND 120),
  headline_prefix TEXT NOT NULL CHECK (char_length(btrim(headline_prefix)) BETWEEN 2 AND 160),
  headline_highlight TEXT NOT NULL CHECK (char_length(btrim(headline_highlight)) BETWEEN 2 AND 160),
  subtext TEXT NOT NULL CHECK (char_length(btrim(subtext)) BETWEEN 10 AND 600),
  cta_label TEXT NOT NULL CHECK (char_length(btrim(cta_label)) BETWEEN 2 AND 60),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_hero_settings IS 'Admin-managed homepage hero headline, subtext, and primary CTA label.';

ALTER TABLE public.homepage_hero_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage hero settings" ON public.homepage_hero_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage hero settings" ON public.homepage_hero_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_hero_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_hero_settings TO anon, authenticated;
GRANT UPDATE (eyebrow_text, headline_prefix, headline_highlight, subtext, cta_label, updated_at, updated_by) ON TABLE public.homepage_hero_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_hero_settings TO service_role;

INSERT INTO public.homepage_hero_settings (id, eyebrow_text, headline_prefix, headline_highlight, subtext, cta_label) VALUES (
  1,
  'For Skincare & Cosmeceutical Professionals',
  'Turn ingredient science into',
  'decisions you can defend.',
  'Structured courses in skin science and cosmeceutical ingredients, built for professionals who evaluate products and advise clients with confidence.',
  'See Courses & Pricing'
);

-- ============================================================================
-- Why Choose Us section
-- ============================================================================
CREATE TABLE public.homepage_why_choose_us_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow_text TEXT NOT NULL CHECK (char_length(btrim(eyebrow_text)) BETWEEN 2 AND 120),
  heading_prefix TEXT NOT NULL CHECK (char_length(btrim(heading_prefix)) BETWEEN 2 AND 160),
  heading_highlight TEXT NOT NULL CHECK (char_length(btrim(heading_highlight)) BETWEEN 2 AND 160),
  subtext TEXT NOT NULL CHECK (char_length(btrim(subtext)) BETWEEN 10 AND 600),
  cta_label TEXT NOT NULL CHECK (char_length(btrim(cta_label)) BETWEEN 2 AND 60),
  features JSONB NOT NULL CHECK (jsonb_typeof(features) = 'array' AND jsonb_array_length(features) BETWEEN 1 AND 12),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_why_choose_us_settings IS 'Admin-managed "Why Choose Us" section copy and feature list (features is a JSON array of {title, description, icon}).';

ALTER TABLE public.homepage_why_choose_us_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage why choose us settings" ON public.homepage_why_choose_us_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage why choose us settings" ON public.homepage_why_choose_us_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_why_choose_us_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_why_choose_us_settings TO anon, authenticated;
GRANT UPDATE (eyebrow_text, heading_prefix, heading_highlight, subtext, cta_label, features, updated_at, updated_by) ON TABLE public.homepage_why_choose_us_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_why_choose_us_settings TO service_role;

INSERT INTO public.homepage_why_choose_us_settings (id, eyebrow_text, heading_prefix, heading_highlight, subtext, cta_label, features) VALUES (
  1,
  'The Tutiba Standard',
  'Why professionals',
  'choose Tutiba.',
  'Courses taught by a specialist, organized into clear stages, with lifetime access.',
  'Compare all courses',
  '[
    {"title": "Evidence-Based", "description": "Built on published research and clear reasoning, explained without sales language.", "icon": "Microscope"},
    {"title": "Expert Instructors", "description": "Study with specialists who connect the science to real practice.", "icon": "UsersRound"},
    {"title": "Free Preview Lessons", "description": "Watch a complete lesson before you enroll, so you know exactly what you are paying for.", "icon": "PlayCircle"},
    {"title": "Lifetime Updates", "description": "Return to your courses as lessons and supporting resources are updated.", "icon": "RefreshCw"},
    {"title": "Learn Anywhere", "description": "Works on desktop, tablet, and mobile, wherever you study.", "icon": "Laptop"},
    {"title": "Practical Focus", "description": "Build the skill to evaluate real products, using the science underneath.", "icon": "BookOpenCheck"}
  ]'::jsonb
);

-- ============================================================================
-- Learning Method section
-- ============================================================================
CREATE TABLE public.homepage_learning_method_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow_text TEXT NOT NULL CHECK (char_length(btrim(eyebrow_text)) BETWEEN 2 AND 120),
  heading TEXT NOT NULL CHECK (char_length(btrim(heading)) BETWEEN 2 AND 160),
  subtext TEXT NOT NULL CHECK (char_length(btrim(subtext)) BETWEEN 10 AND 600),
  curriculum JSONB NOT NULL CHECK (jsonb_typeof(curriculum) = 'array' AND jsonb_array_length(curriculum) BETWEEN 1 AND 12),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_learning_method_settings IS 'Admin-managed featured-curriculum section copy and stage list (curriculum is a JSON array of {title, description, icon}). The CTA button text/link stays driven by the primary diploma course lookup, not this table.';

ALTER TABLE public.homepage_learning_method_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage learning method settings" ON public.homepage_learning_method_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage learning method settings" ON public.homepage_learning_method_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_learning_method_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_learning_method_settings TO anon, authenticated;
GRANT UPDATE (eyebrow_text, heading, subtext, curriculum, updated_at, updated_by) ON TABLE public.homepage_learning_method_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_learning_method_settings TO service_role;

INSERT INTO public.homepage_learning_method_settings (id, eyebrow_text, heading, subtext, curriculum) VALUES (
  1,
  'Featured curriculum',
  'Inside this featured course',
  'Part 1 moves from skin anatomy into hyaluronic-acid science, ingredient comparison, and product-level application.',
  '[
    {"title": "Skin layers and product targets", "description": "Evaluate products intended for the dermis and hypodermis against skin structure.", "icon": "ScanSearch"},
    {"title": "Hyaluronic acid by molecular size", "description": "Understand how molecular size changes penetration, effect, and the claims a formula can reasonably make.", "icon": "FlaskConical"},
    {"title": "From ingredient science to product comparison", "description": "Use the scientific foundation to compare finished products by what they actually contain.", "icon": "BookOpenCheck"}
  ]'::jsonb
);

-- ============================================================================
-- Instructor section
-- ============================================================================
CREATE TABLE public.homepage_instructor_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow_text TEXT NOT NULL CHECK (char_length(btrim(eyebrow_text)) BETWEEN 2 AND 120),
  heading_prefix TEXT NOT NULL CHECK (char_length(btrim(heading_prefix)) BETWEEN 2 AND 160),
  heading_highlight TEXT NOT NULL CHECK (char_length(btrim(heading_highlight)) BETWEEN 2 AND 160),
  bio TEXT NOT NULL CHECK (char_length(btrim(bio)) BETWEEN 10 AND 800),
  instructor_name TEXT NOT NULL CHECK (char_length(btrim(instructor_name)) BETWEEN 2 AND 160),
  experience_badge_value TEXT NOT NULL CHECK (char_length(btrim(experience_badge_value)) BETWEEN 1 AND 12),
  experience_badge_label TEXT NOT NULL CHECK (char_length(btrim(experience_badge_label)) BETWEEN 2 AND 60),
  credential_pills JSONB NOT NULL CHECK (jsonb_typeof(credential_pills) = 'array' AND jsonb_array_length(credential_pills) BETWEEN 1 AND 6),
  bullets JSONB NOT NULL CHECK (jsonb_typeof(bullets) = 'array' AND jsonb_array_length(bullets) BETWEEN 1 AND 8),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_instructor_settings IS 'Admin-managed instructor bio section copy. The instructor photo asset path stays hardcoded (no image upload workflow attached to this table).';

ALTER TABLE public.homepage_instructor_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage instructor settings" ON public.homepage_instructor_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage instructor settings" ON public.homepage_instructor_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_instructor_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_instructor_settings TO anon, authenticated;
GRANT UPDATE (eyebrow_text, heading_prefix, heading_highlight, bio, instructor_name, experience_badge_value, experience_badge_label, credential_pills, bullets, updated_at, updated_by) ON TABLE public.homepage_instructor_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_instructor_settings TO service_role;

INSERT INTO public.homepage_instructor_settings (id, eyebrow_text, heading_prefix, heading_highlight, bio, instructor_name, experience_badge_value, experience_badge_label, credential_pills, bullets) VALUES (
  1,
  'Your Instructor',
  'Meet',
  'your instructor.',
  'Learn skin, hair, and beauty-nutrition science from an educator who has spent more than a decade turning research into decisions professionals use every day.',
  'Dr. Aya Elbrashy — Skin, Hair and Beauty Nutrition',
  '10+',
  'Years of Experience',
  '[
    {"label": "Skin & Beauty Nutrition Specialist", "icon": "GraduationCap"},
    {"label": "Evidence-Based Curriculum", "icon": "Microscope"}
  ]'::jsonb,
  '[
    "Skin structure linked directly to cosmeceutical action",
    "Ingredient and product comparisons you can apply",
    "Structured diploma stages with visible progress"
  ]'::jsonb
);

-- ============================================================================
-- Outcomes section
-- ============================================================================
CREATE TABLE public.homepage_outcomes_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow_text TEXT NOT NULL CHECK (char_length(btrim(eyebrow_text)) BETWEEN 2 AND 120),
  heading_prefix TEXT NOT NULL CHECK (char_length(btrim(heading_prefix)) BETWEEN 2 AND 160),
  heading_highlight TEXT NOT NULL CHECK (char_length(btrim(heading_highlight)) BETWEEN 2 AND 160),
  outcomes JSONB NOT NULL CHECK (jsonb_typeof(outcomes) = 'array' AND jsonb_array_length(outcomes) BETWEEN 1 AND 12),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_outcomes_settings IS 'Admin-managed "Why enroll with confidence" section copy and outcome list (outcomes is a JSON array of {title, description, icon}).';

ALTER TABLE public.homepage_outcomes_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage outcomes settings" ON public.homepage_outcomes_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage outcomes settings" ON public.homepage_outcomes_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_outcomes_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_outcomes_settings TO anon, authenticated;
GRANT UPDATE (eyebrow_text, heading_prefix, heading_highlight, outcomes, updated_at, updated_by) ON TABLE public.homepage_outcomes_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_outcomes_settings TO service_role;

INSERT INTO public.homepage_outcomes_settings (id, eyebrow_text, heading_prefix, heading_highlight, outcomes) VALUES (
  1,
  'Why enroll with confidence',
  'Built so you can',
  'learn it, then use it.',
  '[
    {"title": "Clear course stages", "description": "Move through ordered stages, like Part 1 and Part 2, so you always know what comes next.", "icon": "Layers"},
    {"title": "Evidence-based curriculum", "description": "Every lesson is grounded in current science and reasoned argument.", "icon": "Microscope"},
    {"title": "Apply it immediately", "description": "Apply the science to real product evaluations and decisions you can stand behind.", "icon": "ScanSearch"},
    {"title": "Secure enrollment", "description": "Checkout and account access are secured end-to-end.", "icon": "ShieldCheck"}
  ]'::jsonb
);

-- ============================================================================
-- Free content section
-- ============================================================================
CREATE TABLE public.homepage_free_content_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  heading TEXT NOT NULL CHECK (char_length(btrim(heading)) BETWEEN 2 AND 160),
  subtext TEXT NOT NULL CHECK (char_length(btrim(subtext)) BETWEEN 10 AND 600),
  items JSONB NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 6),
  view_all_label TEXT NOT NULL CHECK (char_length(btrim(view_all_label)) BETWEEN 2 AND 60),
  view_all_url TEXT NOT NULL CHECK (view_all_url ~ '^/'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.homepage_free_content_settings IS 'Admin-managed "Free Learning Resources" section copy and card list (items is a JSON array of {type_label, title, icon, image_url, cta_label, link_url, is_prominent}). view_all_url and each item link_url must be an internal path starting with "/".';

ALTER TABLE public.homepage_free_content_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage free content settings" ON public.homepage_free_content_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update homepage free content settings" ON public.homepage_free_content_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
REVOKE ALL ON TABLE public.homepage_free_content_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_free_content_settings TO anon, authenticated;
GRANT UPDATE (heading, subtext, items, view_all_label, view_all_url, updated_at, updated_by) ON TABLE public.homepage_free_content_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_free_content_settings TO service_role;

INSERT INTO public.homepage_free_content_settings (id, heading, subtext, items, view_all_label, view_all_url) VALUES (
  1,
  'Explore Free Learning Resources',
  'See our teaching approach in action with practical guides and free lessons.',
  '[
    {"type_label": "Guide", "title": "A Practical Guide to Building a Professional Skin-Care Routine", "icon": "FileText", "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop", "cta_label": "Read the Guide", "link_url": "/courses", "is_prominent": false},
    {"type_label": "Video Lesson", "title": "How to Evaluate Active Ingredients in Skin-Care Products", "icon": "PlayCircle", "image_url": "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop", "cta_label": "Watch the Lesson", "link_url": "/courses", "is_prominent": true},
    {"type_label": "Learning Resource", "title": "How to Read and Understand an INCI Ingredient List", "icon": "Play", "image_url": "https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=600&auto=format&fit=crop", "cta_label": "Read the Guide", "link_url": "/courses", "is_prominent": false}
  ]'::jsonb,
  'View All Free Resources',
  '/courses'
);

-- ============================================================================
-- FAQ entries (list, shared by the homepage FAQ preview and the standalone /faq page)
-- ============================================================================
CREATE TABLE public.homepage_faq_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL CHECK (char_length(btrim(question)) BETWEEN 5 AND 200),
  answer TEXT NOT NULL CHECK (char_length(btrim(answer)) BETWEEN 5 AND 2000),
  display_order SMALLINT NOT NULL UNIQUE CHECK (display_order > 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.homepage_faq_entries IS 'Admin-managed FAQ entries shown in the homepage FAQ preview and the standalone /faq page.';

CREATE TRIGGER set_homepage_faq_entries_updated_at
  BEFORE UPDATE ON public.homepage_faq_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_faq_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published FAQ entries are publicly readable" ON public.homepage_faq_entries FOR SELECT TO anon USING (is_published = TRUE);
CREATE POLICY "Authenticated users can read permitted FAQ entries" ON public.homepage_faq_entries FOR SELECT TO authenticated USING (is_published = TRUE OR (SELECT public.is_admin()));
CREATE POLICY "Admins can create FAQ entries" ON public.homepage_faq_entries FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins can update FAQ entries" ON public.homepage_faq_entries FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins can delete FAQ entries" ON public.homepage_faq_entries FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

REVOKE ALL ON TABLE public.homepage_faq_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.homepage_faq_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.homepage_faq_entries TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.homepage_faq_entries_id_seq TO authenticated;
GRANT ALL ON TABLE public.homepage_faq_entries TO service_role;

INSERT INTO public.homepage_faq_entries (question, answer, display_order) VALUES
  ('Who are Tutiba courses designed for?', 'Tutiba is built for health, beauty, and skincare professionals who want structured, evidence-based cosmeceutical education. Check each course page for its specific prerequisites.', 1),
  ('Do courses include a certificate?', $faq$Certificates aren't issued on the platform yet. Every course is organized into clear, ordered stages so you can track your own progress, and we'll announce certification here when it's available.$faq$, 2),
  ('Which payment methods are available?', 'Checkout shows your available payment methods and final billing currency before you confirm your purchase.', 3),
  ('How do I get technical support?', $faq$Describe the issue on the Contact page and include the email address on your account. Our support team will follow up as soon as they can.$faq$, 4);

-- Atomically swaps a FAQ entry's display_order with its neighbor, mirroring
-- admin_move_legacy_testimonial's temp-slot technique to avoid the display_order
-- UNIQUE constraint colliding mid-swap.
CREATE OR REPLACE FUNCTION public.admin_move_homepage_faq_entry(p_id BIGINT, p_direction TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_order SMALLINT;
  v_neighbor_id BIGINT;
  v_neighbor_order SMALLINT;
  v_temp_order SMALLINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder FAQ entries';
  END IF;

  IF p_direction NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction;
  END IF;

  SELECT display_order INTO v_current_order FROM public.homepage_faq_entries WHERE id = p_id;
  IF v_current_order IS NULL THEN
    RAISE EXCEPTION 'FAQ entry % not found', p_id;
  END IF;

  IF p_direction = 'up' THEN
    SELECT id, display_order INTO v_neighbor_id, v_neighbor_order
    FROM public.homepage_faq_entries WHERE display_order < v_current_order ORDER BY display_order DESC LIMIT 1;
  ELSE
    SELECT id, display_order INTO v_neighbor_id, v_neighbor_order
    FROM public.homepage_faq_entries WHERE display_order > v_current_order ORDER BY display_order ASC LIMIT 1;
  END IF;

  IF v_neighbor_id IS NULL THEN
    RETURN;
  END IF;

  SELECT max(display_order) + 1 INTO v_temp_order FROM public.homepage_faq_entries;

  UPDATE public.homepage_faq_entries SET display_order = v_temp_order WHERE id = p_id;
  UPDATE public.homepage_faq_entries SET display_order = v_current_order WHERE id = v_neighbor_id;
  UPDATE public.homepage_faq_entries SET display_order = v_neighbor_order WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_move_homepage_faq_entry(BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_move_homepage_faq_entry(BIGINT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

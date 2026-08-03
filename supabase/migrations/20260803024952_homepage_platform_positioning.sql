BEGIN;

ALTER TABLE public.legacy_testimonials
  ADD COLUMN title TEXT NOT NULL DEFAULT 'Tutiba Student'
  CHECK (char_length(btrim(title)) BETWEEN 2 AND 120);

COMMENT ON COLUMN public.legacy_testimonials.title IS
  'Admin-editable professional title. Existing testimonials use the truthful generic Tutiba Student placeholder until verified.';

CREATE POLICY "Admins can manage legacy testimonials"
  ON public.legacy_testimonials
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

GRANT INSERT, UPDATE, DELETE ON TABLE public.legacy_testimonials TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.legacy_testimonials_id_seq TO authenticated;
GRANT ALL ON TABLE public.legacy_testimonials TO service_role;

CREATE TABLE public.blog_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 180),
  excerpt TEXT NOT NULL CHECK (char_length(btrim(excerpt)) BETWEEN 10 AND 600),
  cover_image_url TEXT NULL CHECK (cover_image_url IS NULL OR btrim(cover_image_url) ~ '^https?://'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_publication_state_check CHECK (
    (status = 'draft') OR (status = 'published' AND published_at IS NOT NULL)
  )
);

CREATE INDEX blog_posts_published_at_idx
  ON public.blog_posts (published_at DESC, id DESC)
  WHERE status = 'published';

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blog posts are publicly readable"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_admin()));

CREATE POLICY "Admins can create blog posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

REVOKE ALL ON TABLE public.blog_posts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.blog_posts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.blog_posts_id_seq TO authenticated;
GRANT ALL ON TABLE public.blog_posts TO service_role;
GRANT ALL ON SEQUENCE public.blog_posts_id_seq TO service_role;

INSERT INTO public.blog_posts (slug, title, excerpt, status, published_at)
VALUES
  ('sample-article-evidence-based-learning', 'Sample article — edit or replace me', 'A placeholder introduction to evidence-based professional learning. Edit this title and excerpt from the admin area.', 'published', now() - interval '2 days'),
  ('sample-article-reading-skincare-research', 'Sample article — edit or replace me (2)', 'A placeholder for practical guidance on reading skincare research and translating evidence into sound product decisions.', 'published', now() - interval '1 day'),
  ('sample-article-continuing-education', 'Sample article — edit or replace me (3)', 'A placeholder for insights on continuing professional education, expert teaching, and learning that fits clinical practice.', 'published', now());

UPDATE public.courses
SET description = regexp_replace(description, E'(^|\\n)[[:space:]]*>[[:space:]]*', E'\\1', 'g')
WHERE description ~ E'(^|\\n)[[:space:]]*>';

CREATE FUNCTION public.get_public_course_preview(p_course_id UUID)
RETURNS TABLE (lesson_id UUID, lesson_title TEXT, video_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT l.id, l.title, l.video_url
  FROM public.lessons AS l
  JOIN public.course_sections AS s ON s.id = l.section_id AND s.course_id = l.course_id
  JOIN public.courses AS c ON c.id = l.course_id
  WHERE l.course_id = p_course_id
    AND l.is_preview = TRUE AND l.is_published = TRUE AND l.deleted_at IS NULL
    AND l.video_url IS NOT NULL AND btrim(l.video_url) <> ''
    AND s.is_published = TRUE AND s.deleted_at IS NULL
    AND c.status = 'published' AND COALESCE(c.visibility, 'public') = 'public'
  ORDER BY s.order_index, l.order_index, l.id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_course_preview(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_course_preview(UUID) TO anon, authenticated;

COMMENT ON TABLE public.blog_posts IS
  'Minimal admin-managed article previews for the Tutiba homepage. Full public article routing is intentionally deferred.';

NOTIFY pgrst, 'reload schema';

COMMIT;

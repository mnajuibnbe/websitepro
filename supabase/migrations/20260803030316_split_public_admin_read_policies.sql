BEGIN;

DROP POLICY "Published testimonials and admin collection are readable" ON public.legacy_testimonials;
CREATE POLICY "Published legacy testimonials are publicly readable"
  ON public.legacy_testimonials FOR SELECT TO anon
  USING (is_published = TRUE);
CREATE POLICY "Authenticated users can read permitted legacy testimonials"
  ON public.legacy_testimonials FOR SELECT TO authenticated
  USING (is_published = TRUE OR (SELECT public.is_admin()));

DROP POLICY "Published blog posts are publicly readable" ON public.blog_posts;
CREATE POLICY "Published blog posts are publicly readable"
  ON public.blog_posts FOR SELECT TO anon
  USING (status = 'published');
CREATE POLICY "Authenticated users can read permitted blog posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (status = 'published' OR (SELECT public.is_admin()));

NOTIFY pgrst, 'reload schema';
COMMIT;

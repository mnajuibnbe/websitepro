-- Blog editor UX pass: replace the cover-image URL text field with a real upload,
-- mirroring the course-covers bucket contract (see 20260728030000_media_duration_pipeline.sql
-- and 20260730050000_course_cover_optimization.sql) — admin-only, pre-optimized WebP,
-- public read via the bucket's public URL (no RLS SELECT policy needed for that path),
-- and a cleanup trigger so replacing/removing a cover doesn't leave orphaned blobs in
-- storage. blog_posts.cover_image_url keeps storing only the resulting https:// URL
-- (its existing CHECK constraint already requires that shape) — no binary data in Postgres.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-covers', 'blog-covers', TRUE, 716800, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins upload blog covers" ON storage.objects;
CREATE POLICY "Admins upload blog covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-covers' AND public.is_admin() AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Admins update blog covers" ON storage.objects;
CREATE POLICY "Admins update blog covers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-covers' AND public.is_admin()) WITH CHECK (bucket_id = 'blog-covers' AND public.is_admin());
DROP POLICY IF EXISTS "Admins delete blog covers" ON storage.objects;
CREATE POLICY "Admins delete blog covers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-covers' AND public.is_admin());

CREATE OR REPLACE FUNCTION public.cleanup_replaced_blog_cover() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE v_name TEXT;
BEGIN
  IF OLD.cover_image_url IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.cover_image_url = NEW.cover_image_url THEN RETURN NEW; END IF;
  v_name := split_part(OLD.cover_image_url, '/blog-covers/', 2);
  IF v_name <> '' AND NOT EXISTS (
    SELECT 1 FROM public.blog_posts b WHERE b.id <> OLD.id AND b.cover_image_url = OLD.cover_image_url
  ) THEN
    DELETE FROM storage.objects WHERE bucket_id = 'blog-covers' AND name = v_name;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_blog_posts_cleanup_cover ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_cleanup_cover AFTER UPDATE OF cover_image_url OR DELETE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_replaced_blog_cover();
REVOKE ALL ON FUNCTION public.cleanup_replaced_blog_cover() FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
COMMIT;

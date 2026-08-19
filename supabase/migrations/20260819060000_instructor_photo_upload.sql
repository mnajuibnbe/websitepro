BEGIN;

-- Mirrors the blog-covers upload contract (20260816160000_blog_cover_upload_storage.sql):
-- admin-only, pre-optimized WebP, public read via the bucket's own public URL, cleanup
-- trigger so replacing the instructor photo doesn't leave an orphaned blob in storage.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('instructor-photos', 'instructor-photos', TRUE, 512000, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins upload instructor photos" ON storage.objects;
CREATE POLICY "Admins upload instructor photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'instructor-photos' AND public.is_admin() AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Admins update instructor photos" ON storage.objects;
CREATE POLICY "Admins update instructor photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'instructor-photos' AND public.is_admin()) WITH CHECK (bucket_id = 'instructor-photos' AND public.is_admin());
DROP POLICY IF EXISTS "Admins delete instructor photos" ON storage.objects;
CREATE POLICY "Admins delete instructor photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'instructor-photos' AND public.is_admin());

ALTER TABLE public.homepage_instructor_settings ADD COLUMN photo_url TEXT;
UPDATE public.homepage_instructor_settings SET photo_url = '/images/tutiba-instructor-logo.png' WHERE id = 1;
ALTER TABLE public.homepage_instructor_settings
  ALTER COLUMN photo_url SET NOT NULL,
  ADD CONSTRAINT homepage_instructor_settings_photo_url_check CHECK (photo_url ~ '^(https?://|/)');

COMMENT ON COLUMN public.homepage_instructor_settings.photo_url IS
  'Either an uploaded instructor-photos storage URL (https://) or the legacy static asset path (/images/...).';

GRANT UPDATE (photo_url) ON TABLE public.homepage_instructor_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_replaced_instructor_photo() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE v_name TEXT;
BEGIN
  IF OLD.photo_url IS NULL OR OLD.photo_url = NEW.photo_url THEN RETURN NEW; END IF;
  v_name := split_part(OLD.photo_url, '/instructor-photos/', 2);
  IF v_name <> '' THEN
    DELETE FROM storage.objects WHERE bucket_id = 'instructor-photos' AND name = v_name;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_instructor_settings_cleanup_photo ON public.homepage_instructor_settings;
CREATE TRIGGER trg_instructor_settings_cleanup_photo AFTER UPDATE OF photo_url ON public.homepage_instructor_settings
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_replaced_instructor_photo();
REVOKE ALL ON FUNCTION public.cleanup_replaced_instructor_photo() FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
COMMIT;

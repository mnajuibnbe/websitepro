-- Fix: deleting a blog post (or replacing/removing its cover) fails outright.
--
-- cleanup_replaced_blog_cover() (20260816160000_blog_cover_upload_storage.sql) runs its
-- own `DELETE FROM storage.objects` to remove the now-orphaned cover blob. storage's
-- built-in protect_delete() trigger blocks any direct DELETE against storage.objects
-- unless the current transaction has opted in via the storage.allow_delete_query
-- setting -- confirmed live: DELETE FROM blog_posts (and UPDATE ... SET
-- cover_image_url = ...) on a row with a cover raises "Direct deletion from storage
-- tables is not allowed", so admins could not delete any blog post that ever had a
-- cover image, nor replace/remove an existing post's cover on save.
--
-- The equivalent course-cover cleanup path hit the identical error (see
-- 20260814120000_repair_admin_delete_empty_course.sql) and was fixed there by setting
-- storage.allow_delete_query = 'true' with SET LOCAL, scoped to that function's own
-- transaction (auto-reverts on commit/rollback). This function is SECURITY DEFINER and
-- runs the DELETE itself, so the same opt-in goes directly here.
BEGIN;

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
    -- Scoped to this transaction only; see note above.
    SET LOCAL storage.allow_delete_query = 'true';
    DELETE FROM storage.objects WHERE bucket_id = 'blog-covers' AND name = v_name;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.cleanup_replaced_blog_cover() FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Phase 5: enforce the optimized course-cover storage contract.
BEGIN;
UPDATE storage.buckets SET file_size_limit=716800,allowed_mime_types=ARRAY['image/webp'] WHERE id='course-covers';
DROP POLICY IF EXISTS "Authors delete own course covers" ON storage.objects;
CREATE POLICY "Authors delete own course covers" ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='course-covers' AND (storage.foldername(name))[1]=auth.uid()::text AND (public.is_admin() OR public.is_approved_instructor(auth.uid())));

CREATE OR REPLACE FUNCTION public.cleanup_replaced_course_cover() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE v_url TEXT;v_name TEXT;
BEGIN
  FOR v_url IN SELECT DISTINCT value FROM unnest(ARRAY[OLD.cover_image,OLD.thumbnail]) value WHERE value IS NOT NULL LOOP
    IF (TG_OP='UPDATE' AND v_url IN (COALESCE(NEW.cover_image,''),COALESCE(NEW.thumbnail,''))) THEN CONTINUE; END IF;
    v_name:=split_part(v_url,'/course-covers/',2);
    IF v_name<>'' AND NOT EXISTS(SELECT 1 FROM public.courses c WHERE c.id<>OLD.id AND v_url IN (c.cover_image,c.thumbnail)) THEN
      DELETE FROM storage.objects WHERE bucket_id='course-covers' AND name=v_name;
    END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_courses_cleanup_cover ON public.courses;
CREATE TRIGGER trg_courses_cleanup_cover AFTER UPDATE OF cover_image,thumbnail OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.cleanup_replaced_course_cover();
REVOKE ALL ON FUNCTION public.cleanup_replaced_course_cover() FROM PUBLIC;
NOTIFY pgrst,'reload schema';
COMMIT;

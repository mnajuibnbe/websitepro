BEGIN;

DROP POLICY "Published legacy testimonials are publicly readable" ON public.legacy_testimonials;
DROP POLICY "Admins can manage legacy testimonials" ON public.legacy_testimonials;

CREATE POLICY "Published testimonials and admin collection are readable"
  ON public.legacy_testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE OR (SELECT public.is_admin()));

CREATE POLICY "Admins can create legacy testimonials"
  ON public.legacy_testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can update legacy testimonials"
  ON public.legacy_testimonials
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can delete legacy testimonials"
  ON public.legacy_testimonials
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

COMMIT;

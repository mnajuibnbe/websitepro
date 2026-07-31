BEGIN;

ALTER TABLE public.courses ALTER COLUMN language SET DEFAULT 'English';
UPDATE public.courses SET language='English' WHERE language IS NULL OR btrim(language)='';

CREATE OR REPLACE FUNCTION public.generate_course_seo_title(p_title text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT left(coalesce(nullif(btrim(regexp_replace(p_title, '<[^>]*>', ' ', 'g')), ''), 'Professional online course') || ' | Tutiba', 60)
$$;

CREATE OR REPLACE FUNCTION public.generate_course_seo_description(p_short_description text, p_description text, p_category text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT left(regexp_replace(coalesce(nullif(btrim(p_short_description), ''), nullif(btrim(p_description), ''), 'Build practical, evidence-based skills with this ' || coalesce(nullif(btrim(p_category), ''), 'professional') || ' online course from Tutiba.'), '<[^>]*>', ' ', 'g'), 160)
$$;

CREATE OR REPLACE FUNCTION public.apply_course_seo_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF nullif(btrim(NEW.seo_title), '') IS NULL THEN NEW.seo_title := public.generate_course_seo_title(NEW.title); END IF;
  IF nullif(btrim(NEW.seo_description), '') IS NULL THEN NEW.seo_description := public.generate_course_seo_description(NEW.short_description, NEW.description, NEW.category); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_courses_seo_defaults ON public.courses;
CREATE TRIGGER trg_courses_seo_defaults BEFORE INSERT OR UPDATE OF title, short_description, description, category, seo_title, seo_description ON public.courses FOR EACH ROW EXECUTE FUNCTION public.apply_course_seo_defaults();

UPDATE public.courses SET seo_title=seo_title, seo_description=seo_description WHERE nullif(btrim(seo_title),'') IS NULL OR nullif(btrim(seo_description),'') IS NULL;

INSERT INTO public.platform_feature_releases(release_key, applied_by, details)
VALUES ('english-pricing-seo-v1', auth.uid(), jsonb_build_object('migration','20260730090000','interface_language','English','unknown_country_currency','USD','seo_defaults',true))
ON CONFLICT (release_key) DO NOTHING;

COMMIT;

-- Baseline schema reconstruction.
--
-- Disaster-recovery gap fix: public.users, public.courses, public.lessons,
-- and public.enrollments were created directly on production (via the
-- original project scaffold) before this migrations/ directory existed. No
-- file in this repo ever created them, so replaying every tracked migration
-- against an empty database has always failed on the very first file
-- (20260724000000_course_learning_foundation.sql ALTERs public.lessons and
-- references public.courses, neither of which exist without this file).
--
-- (public.newsletter_subscriptions was initially suspected to be part of
-- this same gap but turned out to be created correctly by the tracked
-- migration 20260801215053_homepage_newsletter_subscriptions.sql — its
-- lowercase `create table` statement was just missed by an early
-- case-sensitive grep pass during investigation. No baseline entry needed.)
--
-- This migration reconstructs those 4 tables exactly as they stood
-- immediately before 20260724000000 ran, by reverse-engineering production's
-- current schema and subtracting every column/constraint/index/policy that a
-- later tracked migration is responsible for adding. Columns, constraints,
-- and indexes added by tracked migrations are deliberately NOT included here
-- so each migration can create them itself when replayed in order.
--
-- Reconstructed by cross-referencing production's live schema (pg_catalog /
-- information_schema) against every ADD COLUMN / ADD CONSTRAINT / CREATE
-- INDEX / CREATE POLICY / CREATE TRIGGER statement across supabase/migrations
-- on 2026-08-06. See KNOWN_ISSUES.md for the full investigation notes.

BEGIN;

-- 1. user_role enum (baseline only has student/admin; 'instructor' is added
--    by 20260728035000_instructor_role_enum.sql)
CREATE TYPE public.user_role AS ENUM ('student', 'admin');

-- 2. public.users — mirrors auth.users via handle_new_user()
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users" ON public.users
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow insert on registration" ON public.users
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" ON public.users
  FOR UPDATE TO public
  USING (auth.uid() = id);

-- 3. handle_new_user() + trigger on auth.users
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'مستخدم جديد'),
    'student'
  );
  RETURN new;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. set_updated_at() — shared BEFORE UPDATE trigger function
CREATE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. public.courses (baseline columns only; authoring/pricing/review columns
--    are added later by their respective tracked migrations)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  duration TEXT NULL,
  category TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  thumbnail TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  instructor_id UUID NULL,
  slug TEXT NOT NULL,
  short_description TEXT NULL,
  cover_image TEXT NULL,
  trailer_video TEXT NULL,
  level TEXT NOT NULL DEFAULT 'all_levels',
  language TEXT NOT NULL DEFAULT 'English',
  visibility TEXT NOT NULL DEFAULT 'private',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  certificate_enabled BOOLEAN NOT NULL DEFAULT false,
  sequential_learning BOOLEAN NOT NULL DEFAULT false,
  drip_enabled BOOLEAN NOT NULL DEFAULT false,
  discussion_enabled BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT NULL,
  seo_description TEXT NULL,
  seo_keywords TEXT[] NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_hours NUMERIC(6,2) NULL,
  display_rating NUMERIC(2,1) NULL,
  display_rating_count INTEGER NULL,
  badge TEXT NULL,
  has_certificate BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT courses_level_check CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all_levels'::text])),
  CONSTRAINT courses_price_non_negative_check CHECK (price >= (0)::numeric),
  CONSTRAINT courses_slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text),
  CONSTRAINT courses_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  CONSTRAINT courses_visibility_check CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text, 'unlisted'::text])),
  CONSTRAINT courses_badge_length CHECK (badge IS NULL OR (char_length(btrim(badge)) >= 1 AND char_length(btrim(badge)) <= 40)),
  CONSTRAINT courses_display_rating_count_nonnegative CHECK (display_rating_count IS NULL OR display_rating_count >= 0),
  CONSTRAINT courses_display_rating_range CHECK (display_rating IS NULL OR (display_rating >= (0)::numeric AND display_rating <= (5)::numeric)),
  CONSTRAINT courses_total_hours_nonnegative CHECK (total_hours IS NULL OR total_hours >= (0)::numeric)
);

CREATE UNIQUE INDEX courses_slug_unique_idx ON public.courses USING btree (lower(slug));
CREATE INDEX idx_courses_category ON public.courses USING btree (category);
CREATE INDEX idx_courses_created_at ON public.courses USING btree (created_at DESC);
CREATE INDEX idx_courses_featured ON public.courses USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);
CREATE INDEX idx_courses_published ON public.courses USING btree (published_at DESC) WHERE (status = 'published'::text);
CREATE INDEX idx_courses_status ON public.courses USING btree (status);
CREATE INDEX idx_courses_visibility ON public.courses USING btree (visibility);

CREATE TRIGGER trg_courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. public.lessons (baseline columns only; section_id/authoring/media
--    columns are added later by their respective tracked migrations)
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_url TEXT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  video_url TEXT NULL,
  duration INTEGER NULL,
  type TEXT NULL,
  slug TEXT NULL,
  lesson_type TEXT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 0,
  thumbnail TEXT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_rule TEXT NULL,
  seo_title TEXT NULL,
  seo_description TEXT NULL,
  transcript TEXT NULL,
  captions_url TEXT NULL,
  notes TEXT NULL,
  pdf_allow_download BOOLEAN NOT NULL DEFAULT true,
  pdf_watermark BOOLEAN NOT NULL DEFAULT false,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  embed_code TEXT NULL
);

CREATE TRIGGER trg_lessons_set_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. public.enrollments (untouched by any tracked migration except the
--    status NOT NULL/CHECK hardening added later)
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'pending',
  CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);

COMMIT;

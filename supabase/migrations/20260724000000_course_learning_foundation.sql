-- Migration: 20260724000000_course_learning_foundation.sql
-- Description: Course Learning database foundation, sections, lessons extension, lesson_progress, triggers, and enrollment RLS security policies.

-- 1. Helper function: has_active_enrollment
CREATE OR REPLACE FUNCTION public.has_active_enrollment(target_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid()
      AND course_id = target_course_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create course_sections
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_sections_course_id_order_index_key UNIQUE (course_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course_id_order_index 
ON public.course_sections (course_id, order_index);

-- 3. Extend lessons table
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS section_id UUID NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT NULL,
  ADD COLUMN IF NOT EXISTS content TEXT NULL,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_lessons_course_id_order_index ON public.lessons (course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_section_id_order_index ON public.lessons (section_id, order_index);

ALTER TABLE public.lessons 
  DROP CONSTRAINT IF EXISTS lessons_type_check;

ALTER TABLE public.lessons 
  ADD CONSTRAINT lessons_type_check CHECK (type IN ('video', 'text'));

-- 4. Migrate existing lessons to a default section if missing section_id
DO $$
DECLARE
  c_record RECORD;
  sec_id UUID;
BEGIN
  FOR c_record IN SELECT DISTINCT course_id FROM public.lessons WHERE section_id IS NULL LOOP
    INSERT INTO public.course_sections (course_id, title, order_index, is_published)
    VALUES (c_record.course_id, 'محتوى الكورس', 0, true)
    ON CONFLICT (course_id, order_index) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    IF sec_id IS NULL THEN
      SELECT id INTO sec_id FROM public.course_sections WHERE course_id = c_record.course_id AND order_index = 0 LIMIT 1;
    END IF;

    UPDATE public.lessons
    SET section_id = sec_id
    WHERE course_id = c_record.course_id AND section_id IS NULL;
  END LOOP;
END $$;

-- 5. Create lesson_progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_user_lesson_key UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON public.lesson_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_last_accessed ON public.lesson_progress (user_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_lesson ON public.lesson_progress (course_id, lesson_id);

-- 6. Trigger to sync lesson_progress.course_id from lessons.course_id
CREATE OR REPLACE FUNCTION public.sync_lesson_progress_course_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT course_id INTO NEW.course_id
  FROM public.lessons
  WHERE id = NEW.lesson_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_lesson_progress_course_id ON public.lesson_progress;

CREATE TRIGGER trg_sync_lesson_progress_course_id
BEFORE INSERT OR UPDATE OF lesson_id ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.sync_lesson_progress_course_id();

-- 7. Enable RLS and setup Security Policies

-- Enable RLS
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- course_sections policies
DROP POLICY IF EXISTS "Enrolled students can view published sections" ON public.course_sections;
CREATE POLICY "Enrolled students can view published sections" ON public.course_sections
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_active_enrollment(course_id));

DROP POLICY IF EXISTS "Admins can manage sections" ON public.course_sections;
CREATE POLICY "Admins can manage sections" ON public.course_sections
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- lessons policies
DROP POLICY IF EXISTS "Enrolled students can view published lessons" ON public.lessons;
CREATE POLICY "Enrolled students can view published lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_active_enrollment(course_id));

DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- lesson_progress policies
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own lesson progress if enrolled" ON public.lesson_progress;
CREATE POLICY "Users can insert own lesson progress if enrolled" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_enrollment(course_id));

DROP POLICY IF EXISTS "Users can update own lesson progress if enrolled" ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress if enrolled" ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_active_enrollment(course_id))
  WITH CHECK (user_id = auth.uid() AND public.has_active_enrollment(course_id));

DROP POLICY IF EXISTS "Admins can view lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins can view lesson progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

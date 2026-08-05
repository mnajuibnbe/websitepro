-- Untracked-drift repair (discovered while reconstructing the baseline in
-- 20260723000000_baseline_pre_migration_schema.sql, and again while doing a
-- live replay of every migration against the empty preview project).
--
-- public.course_sections, public.lessons, and public.lesson_progress are all
-- created correctly by tracked migrations (20260724000000, 20260725000000),
-- but production received direct/ad-hoc changes to them outside the
-- migration chain at some point afterward:
--
-- 1. course_sections/lessons: production has a composite FK from lessons to
--    course_sections, a supporting composite unique constraint, a NOT NULL
--    on lessons.section_id, and renamed/added indexes on both tables — none
--    of which any migration file creates. It also no longer has the
--    single-column section_id FK that 20260724000000 auto-creates inline
--    (superseded by the composite FK, dropped directly on production).
--
-- 2. lessons/course_sections RLS: the 4 policies (2 per table) created by
--    20260724000000 were dropped directly on production and never removed
--    by any tracked migration — left dangling on a fresh replay.
--
-- 3. lesson_progress: its 4 RLS policies created by 20260724000000 were
--    renamed directly on production.
--    20260805201717_optimize_rls_initplan_and_fk_indexes.sql's ALTER POLICY
--    statements target the renamed versions, which only exist on
--    production. Also missing the set_updated_at trigger on course_sections
--    (x2, matching lessons' existing duplicate-trigger pattern) and
--    lesson_progress (x1) — present on production, created by no migration.
--
-- See KNOWN_ISSUES.md for the full investigation notes.

BEGIN;

-- course_sections / lessons -------------------------------------------------

ALTER TABLE public.course_sections
  DROP CONSTRAINT IF EXISTS course_sections_course_id_order_index_key;
ALTER TABLE public.course_sections
  ADD CONSTRAINT course_sections_course_order_unique UNIQUE (course_id, order_index);
ALTER TABLE public.course_sections
  ADD CONSTRAINT course_sections_course_id_id_unique UNIQUE (course_id, id);

ALTER TABLE public.lessons
  ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_course_section_fkey
  FOREIGN KEY (course_id, section_id) REFERENCES public.course_sections(course_id, id) ON DELETE CASCADE;
-- Superseded by the composite FK above; production dropped this
-- single-column FK (auto-created inline by 20260724000000) once the
-- composite one existed.
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_section_id_fkey;

DROP INDEX IF EXISTS public.idx_lessons_course_id_order_index;
DROP INDEX IF EXISTS public.idx_lessons_section_id_order_index;
CREATE INDEX idx_lessons_course_order ON public.lessons USING btree (course_id, order_index);
CREATE INDEX idx_lessons_section_order ON public.lessons USING btree (section_id, order_index);
CREATE INDEX idx_lessons_active_section_order ON public.lessons USING btree (section_id, order_index, id) WHERE (deleted_at IS NULL);

DROP INDEX IF EXISTS public.idx_course_sections_course_id_order_index;
CREATE INDEX idx_course_sections_course_order ON public.course_sections USING btree (course_id, order_index);
CREATE INDEX idx_course_sections_active_course_order ON public.course_sections USING btree (course_id, order_index, id) WHERE (deleted_at IS NULL);

-- lesson_progress RLS policy renames -----------------------------------------

ALTER POLICY "Users can view own lesson progress" ON public.lesson_progress
  RENAME TO "Students can view own lesson progress";
ALTER POLICY "Users can insert own lesson progress if enrolled" ON public.lesson_progress
  RENAME TO "Students can create own enrolled progress";
ALTER POLICY "Users can update own lesson progress if enrolled" ON public.lesson_progress
  RENAME TO "Students can update own enrolled progress";
ALTER POLICY "Admins can view lesson progress" ON public.lesson_progress
  RENAME TO "Admins can view all lesson progress";

-- Stale policies superseded elsewhere in the migration chain (lessons by
-- 20260731140635, but the old baseline names were never dropped there; no
-- migration ever touches course_sections' baseline policies at all) --------

DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled students can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage sections" ON public.course_sections;
DROP POLICY IF EXISTS "Enrolled students can view published sections" ON public.course_sections;

-- Missing set_updated_at triggers on course_sections/lesson_progress --------
-- (both tables get updated_at columns from 20260724000000, but no tracked
-- migration ever wires up the trigger; production has them, applied
-- directly).

CREATE TRIGGER trg_course_sections_set_updated_at
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_course_sections_updated_at
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

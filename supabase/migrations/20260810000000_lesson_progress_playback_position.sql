-- Migration: 20260810000000_lesson_progress_playback_position.sql
-- Description: Add last_position_seconds to lesson_progress so students can resume a
-- lesson video from where they left off across sessions. Nullable with no default so
-- "never started" (NULL) stays distinguishable from "started at 0:00" (0).
-- No RLS policy change: existing row-level policies on lesson_progress
-- ("Students can view own lesson progress", "Students can create own enrolled
-- progress", "Students can update own enrolled progress") already gate every column
-- of the row by user_id/enrollment, and Postgres RLS has no per-column granularity,
-- so this column is covered without any additional grant.

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS last_position_seconds NUMERIC NULL;

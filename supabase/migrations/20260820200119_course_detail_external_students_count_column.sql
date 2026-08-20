-- The approved plan for the Course Detail redesign explicitly calls out verified
-- external "learner counts" (not just ratings) as real data to surface. Add one more
-- attribution column, reusing display_rating_source/display_rating_source_url for
-- provenance rather than duplicating source fields.

ALTER TABLE public.courses
  ADD COLUMN display_students_count INTEGER NULL;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_display_students_count_nonnegative
    CHECK (display_students_count IS NULL OR display_students_count >= 0);

COMMENT ON COLUMN public.courses.display_students_count IS
  'Verified external learner count (e.g. Udemy enrolled students), attributed via display_rating_source/display_rating_source_url. Shown transparently, never merged with native Tutiba enrollment counts.';

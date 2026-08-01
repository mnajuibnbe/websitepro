-- Advisor follow-up: the live database already has idx_courses_category on the
-- same leading column. Keep one category index instead of maintaining both.
DROP INDEX IF EXISTS public.courses_category_idx;

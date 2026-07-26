-- Optional Home ordering for published courses.
-- NULL preserves automatic newest-first behavior; lower positive values appear
-- first. Public RLS continues to decide which ordered rows a visitor may read.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS home_order INTEGER NULL;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_home_order_positive;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_home_order_positive
  CHECK (home_order IS NULL OR home_order >= 1);

CREATE INDEX IF NOT EXISTS idx_courses_home_order
  ON public.courses (home_order ASC, published_at DESC, created_at DESC)
  WHERE status = 'published';

COMMENT ON COLUMN public.courses.home_order IS
  'Optional Admin priority for Home. Lower values appear first; NULL falls back to newest published order.';

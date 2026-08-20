-- Course Detail Page redesign: external social-proof attribution columns.
-- Adds admin-editable source/source URL/last-verified columns alongside the
-- existing (previously unused) display_rating/display_rating_count columns on
-- public.courses. Values are shown transparently in the UI - never merged into
-- native Tutiba review aggregates or Course structured data.

ALTER TABLE public.courses
  ADD COLUMN display_rating_source TEXT NULL,
  ADD COLUMN display_rating_source_url TEXT NULL,
  ADD COLUMN display_rating_verified_at DATE NULL;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_display_rating_source_length
    CHECK (display_rating_source IS NULL OR (char_length(btrim(display_rating_source)) BETWEEN 1 AND 60)),
  ADD CONSTRAINT courses_display_rating_source_url_https
    CHECK (display_rating_source_url IS NULL OR display_rating_source_url ~* '^https://');

COMMENT ON COLUMN public.courses.display_rating_source IS
  'Attributed external platform for display_rating, e.g. "Udemy". Admin-editable, shown transparently in the UI - never presented as a native Tutiba rating.';
COMMENT ON COLUMN public.courses.display_rating_source_url IS
  'Official source URL backing display_rating, shown as a transparent attribution link.';
COMMENT ON COLUMN public.courses.display_rating_verified_at IS
  'Date an admin last confirmed display_rating/display_rating_count against the live external source.';

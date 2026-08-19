BEGIN;

ALTER TABLE public.homepage_hero_settings
  ADD COLUMN trust_badges JSONB,
  ADD COLUMN video_badge_text TEXT,
  ADD COLUMN video_heading TEXT,
  ADD COLUMN video_description TEXT,
  ADD COLUMN video_play_label TEXT;

UPDATE public.homepage_hero_settings SET
  trust_badges = '[
    {"label": "Evidence-based content", "icon": "CheckCircle2"},
    {"label": "Expert-led courses", "icon": "BookOpen"},
    {"label": "Lifetime course access", "icon": "RefreshCw"}
  ]'::jsonb,
  video_badge_text = 'Welcome to Tutiba',
  video_heading = 'This is how Tutiba teaches.',
  video_description = 'A short look at how a Tutiba lesson connects the science to a real product decision.',
  video_play_label = 'Play welcome video'
WHERE id = 1;

ALTER TABLE public.homepage_hero_settings
  ALTER COLUMN trust_badges SET NOT NULL,
  ALTER COLUMN video_badge_text SET NOT NULL,
  ALTER COLUMN video_heading SET NOT NULL,
  ALTER COLUMN video_description SET NOT NULL,
  ALTER COLUMN video_play_label SET NOT NULL,
  ADD CONSTRAINT homepage_hero_settings_trust_badges_check CHECK (jsonb_typeof(trust_badges) = 'array' AND jsonb_array_length(trust_badges) BETWEEN 1 AND 6),
  ADD CONSTRAINT homepage_hero_settings_video_badge_text_check CHECK (char_length(btrim(video_badge_text)) BETWEEN 2 AND 60),
  ADD CONSTRAINT homepage_hero_settings_video_heading_check CHECK (char_length(btrim(video_heading)) BETWEEN 2 AND 160),
  ADD CONSTRAINT homepage_hero_settings_video_description_check CHECK (char_length(btrim(video_description)) BETWEEN 10 AND 400),
  ADD CONSTRAINT homepage_hero_settings_video_play_label_check CHECK (char_length(btrim(video_play_label)) BETWEEN 2 AND 60);

COMMENT ON COLUMN public.homepage_hero_settings.trust_badges IS 'JSON array of {label, icon} shown under the primary CTA button.';

GRANT UPDATE (trust_badges, video_badge_text, video_heading, video_description, video_play_label) ON TABLE public.homepage_hero_settings TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

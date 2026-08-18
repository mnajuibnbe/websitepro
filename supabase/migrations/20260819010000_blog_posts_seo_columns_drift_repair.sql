-- Disaster-recovery gap (same class already documented in KNOWN_ISSUES.md's
-- "Disaster-recovery gap: schema could not be rebuilt from migrations alone" entry):
-- production's public.blog_posts carries seven columns that were added directly to
-- production and were never captured by any tracked migration --
--   category, read_time_minutes, seo_title, meta_description, primary_keyword,
--   secondary_keywords, search_intent
-- -- confirmed live via information_schema.columns/pg_constraint against
-- nhknhibsloirpffndzcd. The admin blog editor (AdminBlogPosts.tsx, SeoSidebar.tsx,
-- InternalLinkingPanel.tsx) reads/writes all seven as real columns today, so a
-- from-scratch replay of supabase/migrations/ alone (e.g. rebuilding a lost project)
-- would leave the editor broken with "column does not exist" errors. This migration
-- reconstructs exactly what already exists on production -- column types, defaults,
-- CHECK constraints, and comments all matched against the live schema -- so it is a
-- no-op there and a faithful repair on an empty rebuild.
--
-- original_value_signals and sources (the other two SEO-editor columns) are NOT
-- included here -- those are already created correctly by the tracked
-- 20260816150000_blog_posts_content_depth_columns.sql.
BEGIN;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category TEXT NULL,
  ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS seo_title TEXT NULL,
  ADD COLUMN IF NOT EXISTS meta_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS primary_keyword TEXT NULL,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS search_intent TEXT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_category_length') THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_category_length
      CHECK (category IS NULL OR (char_length(btrim(category)) BETWEEN 1 AND 60));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_read_time_positive') THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_read_time_positive
      CHECK (read_time_minutes IS NULL OR read_time_minutes > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_search_intent_check') THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_search_intent_check
      CHECK (search_intent IS NULL OR search_intent = ANY (ARRAY[
        'informational', 'how_to', 'comparison', 'commercial_investigation',
        'transactional', 'navigational'
      ]::text[]));
  END IF;
END $$;

COMMENT ON COLUMN public.blog_posts.seo_title IS
  'Optional override for the <title>/og:title. Null means derive from title.';
COMMENT ON COLUMN public.blog_posts.meta_description IS
  'Optional override for the meta description/og:description. Null means derive from excerpt.';
COMMENT ON COLUMN public.blog_posts.primary_keyword IS
  'What the admin expects someone to search on Google to find this article. Optional, informs the SEO sidebar only — not a ranking mechanism.';
COMMENT ON COLUMN public.blog_posts.secondary_keywords IS
  'Admin-entered related queries, free text, no external keyword-research source in this phase.';
COMMENT ON COLUMN public.blog_posts.search_intent IS
  'Admin-selected search intent, for the writer''s own planning. One of: informational, how_to, comparison, commercial_investigation, transactional, navigational.';

NOTIFY pgrst, 'reload schema';
COMMIT;

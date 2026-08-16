-- Phase 3 (blog SEO editor): content-depth tooling.
-- Original Value Checker: self-reported, fixed set of signals (not auto-detected).
ALTER TABLE public.blog_posts
  ADD COLUMN original_value_signals TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_original_value_signals_check
  CHECK (original_value_signals <@ ARRAY[
    'personal_experience', 'original_research', 'data', 'screenshots',
    'case_study', 'expert_opinion', 'original_examples', 'testing_results', 'unique_process'
  ]::text[]);

COMMENT ON COLUMN public.blog_posts.original_value_signals IS
  'Self-reported checklist of what makes this article original (Original Value Checker). Never auto-detected.';

-- Sources/citations: structured list of { name, url, accessedDate }, rendered as a
-- References section on the public article page (kept separate from the free-form
-- content HTML so entries stay individually editable/removable).
ALTER TABLE public.blog_posts
  ADD COLUMN sources JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_sources_is_array CHECK (jsonb_typeof(sources) = 'array');

COMMENT ON COLUMN public.blog_posts.sources IS
  'Cited sources for the article: [{ name, url, accessedDate }]. Rendered as a References section on the public page.';

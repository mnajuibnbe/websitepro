-- Phase 0: canonical course-authoring lifecycle and mutation boundary.
BEGIN;

-- Keep the authorization helper in the canonical root migration chain. Some
-- earlier quiz prototypes lived under app/applet and are not deployed by the
-- root Supabase migration runner.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS authoring_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS author_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;

UPDATE public.courses SET author_id = instructor_id WHERE author_id IS NULL AND instructor_id IS NOT NULL;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_authoring_status_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_authoring_status_check
  CHECK (authoring_status IN ('draft', 'in_review', 'approved', 'archived'));
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_review_status_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_review_status_check
  CHECK (review_status IN ('not_submitted', 'submitted', 'changes_requested', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_courses_author_review_updated
  ON public.courses(author_id, review_status, updated_at DESC);

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS content_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;

UPDATE public.lessons
SET content_type = CASE
  WHEN COALESCE(lesson_type, type) = 'video' THEN 'video'
  WHEN COALESCE(lesson_type, type) = 'pdf' THEN 'pdf'
  WHEN COALESCE(lesson_type, type) IN ('external_link', 'link') THEN 'external_link'
  WHEN COALESCE(lesson_type, type) = 'quiz' THEN 'quiz'
  WHEN COALESCE(lesson_type, type) = 'assignment' THEN 'assignment'
  ELSE NULL
END
WHERE content_type IS NULL;

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_content_type_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_content_type_check
  CHECK (content_type IS NULL OR content_type IN ('video', 'pdf', 'external_link', 'quiz', 'assignment'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_course_slug_unique
  ON public.lessons(course_id, slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.authoring_slugify(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $$
  SELECT trim(BOTH '-' FROM regexp_replace(
    regexp_replace(lower(trim(p_value)), '[^[:alnum:]]+', '-', 'g'),
    '-+', '-', 'g'
  ));
$$;

CREATE OR REPLACE FUNCTION public.ensure_course_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_base TEXT; v_candidate TEXT; v_suffix INTEGER := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND trim(NEW.slug) <> '' THEN RETURN NEW; END IF;
  v_base := public.authoring_slugify(NEW.title);
  IF v_base = '' THEN v_base := 'course'; END IF;
  v_candidate := v_base;
  WHILE EXISTS (SELECT 1 FROM public.courses c WHERE c.slug = v_candidate AND c.id <> NEW.id) LOOP
    v_suffix := v_suffix + 1;
    v_candidate := v_base || '-' || v_suffix;
  END LOOP;
  NEW.slug := v_candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_ensure_slug ON public.courses;
CREATE TRIGGER trg_courses_ensure_slug BEFORE INSERT ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.ensure_course_slug();

CREATE OR REPLACE FUNCTION public.ensure_lesson_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_section_course UUID; v_base TEXT; v_candidate TEXT; v_suffix INTEGER := 1;
BEGIN
  IF NEW.section_id IS NOT NULL THEN
    SELECT course_id INTO v_section_course FROM public.course_sections
    WHERE id = NEW.section_id AND deleted_at IS NULL;
    IF v_section_course IS NULL OR v_section_course <> NEW.course_id THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Section does not belong to the lesson course';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR trim(NEW.slug) = '') THEN
    v_base := public.authoring_slugify(NEW.title);
    IF v_base = '' THEN v_base := 'lesson'; END IF;
    v_candidate := v_base;
    WHILE EXISTS (SELECT 1 FROM public.lessons l WHERE l.course_id = NEW.course_id AND l.slug = v_candidate AND l.deleted_at IS NULL) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := v_base || '-' || v_suffix;
    END LOOP;
    NEW.slug := v_candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lessons_integrity ON public.lessons;
CREATE TRIGGER trg_lessons_integrity BEFORE INSERT OR UPDATE OF course_id, section_id ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.ensure_lesson_integrity();

CREATE OR REPLACE FUNCTION public.admin_upsert_lesson(
  p_course_id UUID,
  p_section_id UUID,
  p_lesson_id UUID,
  p_title TEXT,
  p_content_type TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB,
  p_expected_version BIGINT DEFAULT NULL
) RETURNS public.lessons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_lesson public.lessons; v_order INTEGER;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required'; END IF;
  IF p_title IS NULL OR trim(p_title) = '' THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Lesson title is required'; END IF;
  IF p_content_type NOT IN ('video', 'pdf', 'external_link', 'quiz', 'assignment') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Unsupported lesson content type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.course_sections WHERE id = p_section_id AND course_id = p_course_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Section does not belong to course';
  END IF;

  IF p_lesson_id IS NULL THEN
    SELECT COALESCE(MAX(order_index), -1) + 1 INTO v_order FROM public.lessons
      WHERE course_id = p_course_id AND section_id = p_section_id AND deleted_at IS NULL;
    INSERT INTO public.lessons (
      course_id, section_id, title, content_type, lesson_type, type, description, content,
      video_url, content_url, transcript, captions_url, notes, pdf_allow_download,
      pdf_watermark, open_in_new_tab, is_preview, is_published, completion_rule, order_index
    ) VALUES (
      p_course_id, p_section_id, trim(p_title), p_content_type, p_content_type,
      CASE WHEN p_content_type = 'quiz' THEN 'quiz' WHEN p_content_type IN ('pdf', 'external_link') THEN 'text' ELSE 'video' END,
      nullif(trim(p_payload->>'description'), ''), p_payload->>'content', nullif(trim(p_payload->>'video_url'), ''),
      nullif(trim(p_payload->>'content_url'), ''), p_payload->>'transcript', nullif(trim(p_payload->>'captions_url'), ''),
      p_payload->>'notes', COALESCE((p_payload->>'pdf_allow_download')::BOOLEAN, TRUE),
      COALESCE((p_payload->>'pdf_watermark')::BOOLEAN, FALSE), COALESCE((p_payload->>'open_in_new_tab')::BOOLEAN, FALSE),
      COALESCE((p_payload->>'is_preview')::BOOLEAN, FALSE), COALESCE((p_payload->>'is_published')::BOOLEAN, TRUE),
      COALESCE(nullif(p_payload->>'completion_rule', ''), CASE p_content_type WHEN 'video' THEN 'watch90' WHEN 'quiz' THEN 'pass_quiz' WHEN 'assignment' THEN 'upload_assignment' ELSE 'open_resource' END),
      v_order
    ) RETURNING * INTO v_lesson;
  ELSE
    UPDATE public.lessons SET
      section_id = p_section_id, title = trim(p_title), content_type = p_content_type,
      lesson_type = p_content_type,
      type = CASE WHEN p_content_type = 'quiz' THEN 'quiz' WHEN p_content_type IN ('pdf', 'external_link') THEN 'text' ELSE 'video' END,
      description = nullif(trim(p_payload->>'description'), ''), content = p_payload->>'content',
      video_url = nullif(trim(p_payload->>'video_url'), ''), content_url = nullif(trim(p_payload->>'content_url'), ''),
      transcript = p_payload->>'transcript', captions_url = nullif(trim(p_payload->>'captions_url'), ''), notes = p_payload->>'notes',
      pdf_allow_download = COALESCE((p_payload->>'pdf_allow_download')::BOOLEAN, pdf_allow_download),
      pdf_watermark = COALESCE((p_payload->>'pdf_watermark')::BOOLEAN, pdf_watermark),
      open_in_new_tab = COALESCE((p_payload->>'open_in_new_tab')::BOOLEAN, open_in_new_tab),
      is_preview = COALESCE((p_payload->>'is_preview')::BOOLEAN, is_preview),
      is_published = COALESCE((p_payload->>'is_published')::BOOLEAN, is_published),
      completion_rule = COALESCE(nullif(p_payload->>'completion_rule', ''), completion_rule),
      version = version + 1, updated_at = now()
    WHERE id = p_lesson_id AND course_id = p_course_id AND deleted_at IS NULL
      AND (p_expected_version IS NULL OR version = p_expected_version)
    RETURNING * INTO v_lesson;
    IF v_lesson.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Lesson was changed or no longer exists'; END IF;
  END IF;
  RETURN v_lesson;
END;
$$;

REVOKE ALL ON FUNCTION public.authoring_slugify(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_lesson(UUID,UUID,UUID,TEXT,TEXT,JSONB,BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_lesson(UUID,UUID,UUID,TEXT,TEXT,JSONB,BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_duplicate_lesson(p_lesson_id UUID)
RETURNS public.lessons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_source public.lessons; v_copy public.lessons; v_target_order INTEGER;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required'; END IF;
  SELECT * INTO v_source FROM public.lessons WHERE id = p_lesson_id AND deleted_at IS NULL FOR UPDATE;
  IF v_source.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Lesson not found'; END IF;
  IF v_source.content_type IS NULL THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Legacy lesson must be migrated before duplication'; END IF;
  v_target_order := v_source.order_index + 1;
  UPDATE public.lessons SET order_index = order_index + 1, updated_at = now()
    WHERE section_id = v_source.section_id AND deleted_at IS NULL AND order_index >= v_target_order;
  INSERT INTO public.lessons (
    course_id, section_id, title, description, content, video_url, content_url, type, lesson_type,
    content_type, duration, estimated_minutes, thumbnail, attachments, order_index, is_preview,
    is_published, completion_rule, seo_title, seo_description, transcript, captions_url, notes,
    pdf_allow_download, pdf_watermark, open_in_new_tab, embed_code
  ) VALUES (
    v_source.course_id, v_source.section_id, v_source.title || ' (Copy)', v_source.description,
    v_source.content, v_source.video_url, v_source.content_url, v_source.type, v_source.lesson_type,
    v_source.content_type, v_source.duration, v_source.estimated_minutes, v_source.thumbnail,
    v_source.attachments, v_target_order, v_source.is_preview, FALSE, v_source.completion_rule,
    v_source.seo_title, v_source.seo_description, v_source.transcript, v_source.captions_url,
    v_source.notes, v_source.pdf_allow_download, v_source.pdf_watermark,
    v_source.open_in_new_tab, v_source.embed_code
  ) RETURNING * INTO v_copy;
  RETURN v_copy;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_duplicate_lesson(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_duplicate_lesson(UUID) TO authenticated;

COMMENT ON COLUMN public.lessons.content_type IS 'Canonical new-authoring type. NULL identifies unsupported legacy content awaiting migration.';
COMMENT ON COLUMN public.courses.version IS 'Optimistic concurrency token incremented by canonical mutation APIs.';

COMMIT;

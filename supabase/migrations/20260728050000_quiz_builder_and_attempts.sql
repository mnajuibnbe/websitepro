-- Phase 5: production quiz builder and server-enforced attempt lifecycle.
-- Description: Single Choice Quiz database foundation, secure data model, RLS policies, and RPC functions with security review enhancements.

BEGIN;

-- 0. Update lessons_type_check constraint to include 'quiz'
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_type_check CHECK (type IN ('video', 'text', 'quiz'));

-- Helper function: is_admin (Only uses public.users.role = 'admin')
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Helper function: set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Create public.quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
  time_limit_minutes INTEGER NULL CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  max_attempts INTEGER NULL CHECK (max_attempts IS NULL OR max_attempts > 0),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_lesson_id_key UNIQUE (lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes (course_id);

-- Trigger to sync course_id from lessons and ensure lesson type is 'quiz'
CREATE OR REPLACE FUNCTION public.sync_quiz_lesson_and_course()
RETURNS TRIGGER AS $$
DECLARE
  l_course_id UUID;
  l_type TEXT;
BEGIN
  SELECT course_id, type INTO l_course_id, l_type
  FROM public.lessons
  WHERE id = NEW.lesson_id;

  IF l_type IS NULL OR l_type != 'quiz' THEN
    RAISE EXCEPTION 'Referenced lesson must be of type quiz';
  END IF;

  NEW.course_id := l_course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_quiz_lesson_and_course ON public.quizzes;
CREATE TRIGGER trg_sync_quiz_lesson_and_course
BEFORE INSERT OR UPDATE OF lesson_id ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.sync_quiz_lesson_and_course();

DROP TRIGGER IF EXISTS trg_quizzes_set_updated_at ON public.quizzes;
CREATE TRIGGER trg_quizzes_set_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Create public.questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  explanation TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questions_quiz_id_order_index_key UNIQUE (quiz_id, order_index)
);

DROP TRIGGER IF EXISTS trg_questions_set_updated_at ON public.questions;
CREATE TRIGGER trg_questions_set_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Create public.question_options
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_options_question_id_order_index_key UNIQUE (question_id, order_index)
);

-- Partial unique index ensuring at most 1 correct option per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_options_single_correct 
ON public.question_options (question_id) WHERE is_correct = true;

DROP TRIGGER IF EXISTS trg_question_options_set_updated_at ON public.question_options;
CREATE TRIGGER trg_question_options_set_updated_at
BEFORE UPDATE ON public.question_options
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Create public.quiz_attempts (FK references public.users(id))
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  score_points INTEGER NULL CHECK (score_points IS NULL OR score_points >= 0),
  total_points INTEGER NULL CHECK (total_points IS NULL OR total_points > 0),
  score_percentage INTEGER NULL CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100)),
  passed BOOLEAN NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_attempts_user_quiz_attempt_number_key UNIQUE (user_id, quiz_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_started ON public.quiz_attempts (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_status ON public.quiz_attempts (quiz_id, status);

-- Trigger to sync course_id and lesson_id from quizzes with explicit error handling
CREATE OR REPLACE FUNCTION public.sync_quiz_attempt_relations()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
BEGIN
  SELECT course_id, lesson_id INTO v_course_id, v_lesson_id
  FROM public.quizzes
  WHERE id = NEW.quiz_id;

  IF v_course_id IS NULL OR v_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Referenced quiz % does not exist', NEW.quiz_id;
  END IF;

  NEW.course_id := v_course_id;
  NEW.lesson_id := v_lesson_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_quiz_attempt_relations ON public.quiz_attempts;
CREATE TRIGGER trg_sync_quiz_attempt_relations
BEFORE INSERT OR UPDATE OF quiz_id ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.sync_quiz_attempt_relations();

DROP TRIGGER IF EXISTS trg_quiz_attempts_set_updated_at ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_set_updated_at
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Create public.question_attempts
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID NULL REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NULL,
  points_awarded INTEGER NULL CHECK (points_awarded IS NULL OR points_awarded >= 0),
  answered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT question_attempts_attempt_question_key UNIQUE (quiz_attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON public.question_attempts (question_id);

DROP TRIGGER IF EXISTS trg_question_attempts_set_updated_at ON public.question_attempts;
CREATE TRIGGER trg_question_attempts_set_updated_at
BEFORE UPDATE ON public.question_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

-- Admin management policies
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage question options" ON public.question_options;
CREATE POLICY "Admins can manage question options" ON public.question_options
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Admins can view quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view question attempts" ON public.question_attempts;
CREATE POLICY "Admins can view question attempts" ON public.question_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Student policies
-- Students can view published quizzes if actively enrolled
DROP POLICY IF EXISTS "Enrolled students can view published quizzes" ON public.quizzes;
CREATE POLICY "Enrolled students can view published quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_active_enrollment(course_id));

-- NOTE: Direct student SELECT policies on questions and question_options are intentionally REMOVED
-- to prevent pre-submission exposure of explanation, is_correct, and answer keys.
-- Question text and option choices are served exclusively via start_quiz_attempt RPC.
DROP POLICY IF EXISTS "Enrolled students can view published questions" ON public.questions;

-- Student attempt access
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own question attempts" ON public.question_attempts;
CREATE POLICY "Users can view own question attempts" ON public.question_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = question_attempts.quiz_attempt_id
        AND qa.user_id = auth.uid()
    )
  );

-- 7. RPC: start_quiz_attempt
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(target_quiz_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_quiz RECORD;
  v_existing_attempt RECORD;
  v_finished_attempts INTEGER;
  v_new_attempt_number INTEGER;
  v_attempt_id UUID;
  v_attempt_started_at TIMESTAMPTZ;
  v_question_count INTEGER;
  v_invalid_question TEXT;
  v_questions_json JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1. Advisory lock to prevent concurrent attempt creation race conditions
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || '_' || target_quiz_id::text));

  -- 2. Fetch quiz
  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = target_quiz_id;

  IF v_quiz.id IS NULL OR NOT v_quiz.is_published THEN
    RAISE EXCEPTION 'Quiz not found or not published';
  END IF;

  -- 3. Confirm active enrollment
  IF NOT public.has_active_enrollment(v_quiz.course_id) THEN
    RAISE EXCEPTION 'Active enrollment required to access quiz';
  END IF;

  -- 4. Validate quiz integrity
  SELECT COUNT(*) INTO v_question_count
  FROM public.questions
  WHERE quiz_id = target_quiz_id AND is_published = true;

  IF v_question_count = 0 THEN
    RAISE EXCEPTION 'Quiz has no published questions';
  END IF;

  -- Check every published question has >= 2 options and exactly 1 correct option
  SELECT q.id::TEXT INTO v_invalid_question
  FROM public.questions q
  LEFT JOIN public.question_options qo ON qo.question_id = q.id
  WHERE q.quiz_id = target_quiz_id AND q.is_published = true
  GROUP BY q.id
  HAVING COUNT(qo.id) < 2 OR COUNT(CASE WHEN qo.is_correct THEN 1 END) != 1
  LIMIT 1;

  IF v_invalid_question IS NOT NULL THEN
    RAISE EXCEPTION 'Quiz questions are not properly configured';
  END IF;

  -- 5. Recheck for existing in_progress attempt after lock
  SELECT * INTO v_existing_attempt
  FROM public.quiz_attempts
  WHERE user_id = v_user_id AND quiz_id = target_quiz_id AND status = 'in_progress'
  ORDER BY attempt_number DESC
  LIMIT 1;

  IF v_existing_attempt.id IS NOT NULL THEN
    -- Check time limit expiration
    IF v_quiz.time_limit_minutes IS NOT NULL AND now() > (v_existing_attempt.started_at + (v_quiz.time_limit_minutes || ' minutes')::interval) THEN
      UPDATE public.quiz_attempts
      SET status = 'abandoned', updated_at = now()
      WHERE id = v_existing_attempt.id;
      v_existing_attempt := NULL;
    END IF;
  END IF;

  IF v_existing_attempt.id IS NOT NULL THEN
    v_attempt_id := v_existing_attempt.id;
    v_new_attempt_number := v_existing_attempt.attempt_number;
    v_attempt_started_at := v_existing_attempt.started_at;
  ELSE
    -- 6. Respect max_attempts limit
    IF v_quiz.max_attempts IS NOT NULL THEN
      SELECT COUNT(*) INTO v_finished_attempts
      FROM public.quiz_attempts
      WHERE user_id = v_user_id AND quiz_id = target_quiz_id AND status IN ('submitted', 'abandoned');

      IF v_finished_attempts >= v_quiz.max_attempts THEN
        RAISE EXCEPTION 'Maximum attempts reached for this quiz';
      END IF;
    END IF;

    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_new_attempt_number
    FROM public.quiz_attempts
    WHERE user_id = v_user_id AND quiz_id = target_quiz_id;

    -- Create new attempt
    INSERT INTO public.quiz_attempts (
      user_id,
      quiz_id,
      course_id,
      lesson_id,
      attempt_number,
      status,
      started_at
    ) VALUES (
      v_user_id,
      target_quiz_id,
      v_quiz.course_id,
      v_quiz.lesson_id,
      v_new_attempt_number,
      'in_progress',
      now()
    )
    RETURNING id, started_at INTO v_attempt_id, v_attempt_started_at;

    -- Create question_attempts rows
    INSERT INTO public.question_attempts (quiz_attempt_id, question_id)
    SELECT v_attempt_id, id
    FROM public.questions
    WHERE quiz_id = target_quiz_id AND is_published = true
    ON CONFLICT (quiz_attempt_id, question_id) DO NOTHING;
  END IF;

  -- Build questions JSON payload (EXCLUDES explanation and is_correct to prevent leaks before submission)
  SELECT jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'question_text', q.question_text,
      'order_index', q.order_index,
      'points', q.points,
      'selected_option_id', qa.selected_option_id,
      'options', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'option_id', qo.id,
            'option_text', qo.option_text,
            'order_index', qo.order_index
          ) ORDER BY qo.order_index ASC
        )
        FROM public.question_options qo
        WHERE qo.question_id = q.id
      )
    ) ORDER BY q.order_index ASC
  ) INTO v_questions_json
  FROM public.questions q
  JOIN public.question_attempts qa ON qa.question_id = q.id AND qa.quiz_attempt_id = v_attempt_id
  WHERE q.quiz_id = target_quiz_id AND q.is_published = true;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_new_attempt_number,
    'quiz_id', v_quiz.id,
    'course_id', v_quiz.course_id,
    'lesson_id', v_quiz.lesson_id,
    'title', v_quiz.title,
    'description', v_quiz.description,
    'pass_percentage', v_quiz.pass_percentage,
    'time_limit_minutes', v_quiz.time_limit_minutes,
    'max_attempts', v_quiz.max_attempts,
    'started_at', v_attempt_started_at,
    'questions', COALESCE(v_questions_json, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.start_quiz_attempt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_quiz_attempt(UUID) TO authenticated;


-- 8. RPC: save_quiz_answer
CREATE OR REPLACE FUNCTION public.save_quiz_answer(
  target_attempt_id UUID,
  target_question_id UUID,
  target_option_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_quiz RECORD;
  v_valid_question BOOLEAN;
  v_valid_option BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1. Confirm attempt owner and status
  SELECT * INTO v_attempt
  FROM public.quiz_attempts
  WHERE id = target_attempt_id AND user_id = v_user_id;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Quiz attempt not found';
  END IF;

  IF v_attempt.status != 'in_progress' THEN
    RAISE EXCEPTION 'Quiz attempt is not in progress';
  END IF;

  -- 2. Fetch quiz and check time limit
  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = v_attempt.quiz_id;

  IF v_quiz.time_limit_minutes IS NOT NULL AND now() > (v_attempt.started_at + (v_quiz.time_limit_minutes || ' minutes')::interval) THEN
    RAISE EXCEPTION 'Time limit expired for this quiz attempt';
  END IF;

  -- 3. Confirm question belongs to quiz
  SELECT EXISTS (
    SELECT 1 FROM public.questions
    WHERE id = target_question_id AND quiz_id = v_attempt.quiz_id AND is_published = true
  ) INTO v_valid_question;

  IF NOT v_valid_question THEN
    RAISE EXCEPTION 'Invalid question for this quiz attempt';
  END IF;

  -- 4. Confirm option belongs to question
  IF target_option_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.question_options
      WHERE id = target_option_id AND question_id = target_question_id
    ) INTO v_valid_option;

    IF NOT v_valid_option THEN
      RAISE EXCEPTION 'Invalid option for this question';
    END IF;
  END IF;

  -- 5. Save answer in question_attempts
  UPDATE public.question_attempts
  SET
    selected_option_id = target_option_id,
    answered_at = now(),
    updated_at = now()
  WHERE quiz_attempt_id = target_attempt_id AND question_id = target_question_id;

  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', target_attempt_id,
    'question_id', target_question_id,
    'selected_option_id', target_option_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.save_quiz_answer(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_quiz_answer(UUID, UUID, UUID) TO authenticated;


-- 9. RPC: submit_quiz_attempt
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(target_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_quiz RECORD;
  v_lesson RECORD;
  v_total_points INTEGER := 0;
  v_score_points INTEGER := 0;
  v_score_percentage INTEGER := 0;
  v_passed BOOLEAN := false;
  v_q RECORD;
  v_is_correct BOOLEAN;
  v_awarded INTEGER;
  v_is_expired BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1. Lock attempt row to prevent concurrent submissions
  SELECT * INTO v_attempt
  FROM public.quiz_attempts
  WHERE id = target_attempt_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Quiz attempt not found or unauthorized';
  END IF;

  IF v_attempt.status != 'in_progress' THEN
    RAISE EXCEPTION 'Quiz attempt is not in progress';
  END IF;

  -- 2. Confirm active enrollment
  IF NOT public.has_active_enrollment(v_attempt.course_id) THEN
    RAISE EXCEPTION 'Active enrollment required to submit quiz';
  END IF;

  -- 3. Confirm quiz and lesson publication status
  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = v_attempt.quiz_id;

  IF v_quiz.id IS NULL OR NOT v_quiz.is_published THEN
    RAISE EXCEPTION 'Quiz is not published';
  END IF;

  SELECT * INTO v_lesson
  FROM public.lessons
  WHERE id = v_quiz.lesson_id;

  IF v_lesson.id IS NULL OR v_lesson.course_id != v_quiz.course_id OR v_lesson.type != 'quiz' OR NOT v_lesson.is_published THEN
    RAISE EXCEPTION 'Associated lesson is not published or invalid';
  END IF;

  -- Check time expiration status (MVP rule: grade saved answers at expiration)
  IF v_quiz.time_limit_minutes IS NOT NULL AND now() > (v_attempt.started_at + (v_quiz.time_limit_minutes || ' minutes')::interval) THEN
    v_is_expired := true;
  END IF;

  -- 4. Grade each question attempt
  FOR v_q IN
    SELECT
      qa.id AS question_attempt_id,
      qa.selected_option_id,
      q.id AS question_id,
      q.points
    FROM public.questions q
    JOIN public.question_attempts qa ON qa.question_id = q.id AND qa.quiz_attempt_id = target_attempt_id
    WHERE q.quiz_id = v_attempt.quiz_id AND q.is_published = true
  LOOP
    v_total_points := v_total_points + v_q.points;

    IF v_q.selected_option_id IS NOT NULL THEN
      SELECT is_correct INTO v_is_correct
      FROM public.question_options
      WHERE id = v_q.selected_option_id AND question_id = v_q.question_id;

      v_is_correct := COALESCE(v_is_correct, false);
    ELSE
      v_is_correct := false;
    END IF;

    IF v_is_correct THEN
      v_awarded := v_q.points;
      v_score_points := v_score_points + v_awarded;
    ELSE
      v_awarded := 0;
    END IF;

    UPDATE public.question_attempts
    SET
      is_correct = v_is_correct,
      points_awarded = v_awarded,
      updated_at = now()
    WHERE id = v_q.question_attempt_id;
  END LOOP;

  -- 5. Calculate percentage and passed status
  IF v_total_points > 0 THEN
    v_score_percentage := LEAST(100, GREATEST(0, ROUND((v_score_points::numeric / v_total_points::numeric) * 100)));
  ELSE
    v_score_percentage := 0;
  END IF;

  v_passed := (v_score_percentage >= v_quiz.pass_percentage);

  -- 6. Update attempt record
  UPDATE public.quiz_attempts
  SET
    status = 'submitted',
    score_points = v_score_points,
    total_points = v_total_points,
    score_percentage = v_score_percentage,
    passed = v_passed,
    submitted_at = now(),
    updated_at = now()
  WHERE id = target_attempt_id;

  -- 7. Upsert lesson_progress if passed
  IF v_passed THEN
    INSERT INTO public.lesson_progress (
      user_id,
      course_id,
      lesson_id,
      is_completed,
      completed_at,
      last_accessed_at
    ) VALUES (
      v_user_id,
      v_attempt.course_id,
      v_attempt.lesson_id,
      true,
      now(),
      now()
    )
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET
      is_completed = true,
      completed_at = COALESCE(public.lesson_progress.completed_at, now()),
      last_accessed_at = now(),
      updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'attempt_id', target_attempt_id,
    'quiz_id', v_quiz.id,
    'score_points', v_score_points,
    'total_points', v_total_points,
    'score_percentage', v_score_percentage,
    'pass_percentage', v_quiz.pass_percentage,
    'passed', v_passed,
    'submitted_after_expiration', v_is_expired
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID) TO authenticated;


-- 10. RPC: get_quiz_attempt_result (For post-submission review)
CREATE OR REPLACE FUNCTION public.get_quiz_attempt_result(target_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_quiz RECORD;
  v_questions_json JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_attempt
  FROM public.quiz_attempts
  WHERE id = target_attempt_id;

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF v_attempt.user_id != v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized access to quiz attempt results';
  END IF;

  IF v_attempt.status != 'submitted' THEN
    RAISE EXCEPTION 'Quiz results are available only for submitted attempts';
  END IF;

  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = v_attempt.quiz_id;

  -- Build questions JSON with explanations, correctness, and answer details for post-submission review
  SELECT jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'question_text', q.question_text,
      'explanation', q.explanation,
      'order_index', q.order_index,
      'points', q.points,
      'selected_option_id', qa.selected_option_id,
      'is_correct', qa.is_correct,
      'points_awarded', qa.points_awarded,
      'options', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'option_id', qo.id,
            'option_text', qo.option_text,
            'is_correct', qo.is_correct,
            'order_index', qo.order_index
          ) ORDER BY qo.order_index ASC
        )
        FROM public.question_options qo
        WHERE qo.question_id = q.id
      )
    ) ORDER BY q.order_index ASC
  ) INTO v_questions_json
  FROM public.questions q
  JOIN public.question_attempts qa ON qa.question_id = q.id AND qa.quiz_attempt_id = target_attempt_id
  WHERE q.quiz_id = v_attempt.quiz_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'quiz_id', v_quiz.id,
    'status', v_attempt.status,
    'score_points', v_attempt.score_points,
    'total_points', v_attempt.total_points,
    'score_percentage', v_attempt.score_percentage,
    'pass_percentage', v_quiz.pass_percentage,
    'passed', v_attempt.passed,
    'started_at', v_attempt.started_at,
    'submitted_at', v_attempt.submitted_at,
    'questions', COALESCE(v_questions_json, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_quiz_attempt_result(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_attempt_result(UUID) TO authenticated;

-- Author-facing projection. Answer keys remain behind can_author_course.
CREATE OR REPLACE FUNCTION public.get_author_quiz(p_lesson_id UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN q.id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', q.id, 'title', q.title, 'description', q.description,
    'pass_percentage', q.pass_percentage, 'time_limit_minutes', q.time_limit_minutes,
    'max_attempts', q.max_attempts, 'is_published', q.is_published,
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', qu.id, 'question_text', qu.question_text, 'explanation', qu.explanation,
      'points', qu.points, 'options', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', qo.id, 'option_text', qo.option_text, 'is_correct', qo.is_correct
      ) ORDER BY qo.order_index) FROM public.question_options qo WHERE qo.question_id = qu.id), '[]'::jsonb)
    ) ORDER BY qu.order_index) FROM public.questions qu WHERE qu.quiz_id = q.id), '[]'::jsonb)
  ) END
  FROM public.lessons l LEFT JOIN public.quizzes q ON q.lesson_id = l.id
  WHERE l.id = p_lesson_id AND public.can_author_course(l.course_id);
$$;

-- Atomically replace a quiz definition. UUIDs are server-generated and attempts
-- prevent destructive changes after students have started the quiz.
CREATE OR REPLACE FUNCTION public.author_save_quiz(p_lesson_id UUID, p_quiz JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lesson public.lessons; v_quiz_id UUID; v_question JSONB; v_option JSONB; v_question_id UUID; v_question_index INTEGER := 0; v_option_index INTEGER; v_correct INTEGER;
BEGIN
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id AND deleted_at IS NULL FOR UPDATE;
  IF v_lesson.id IS NULL OR NOT public.can_author_course(v_lesson.course_id) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Course author access required'; END IF;
  IF v_lesson.content_type <> 'quiz' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Lesson must use quiz content type'; END IF;
  IF jsonb_array_length(COALESCE(p_quiz->'questions','[]'::jsonb)) < 1 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Add at least one question'; END IF;
  IF char_length(trim(p_quiz->>'title')) < 2 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Quiz title is required'; END IF;
  IF COALESCE((p_quiz->>'pass_percentage')::INTEGER,70) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Pass score must be between 1 and 100'; END IF;
  IF COALESCE(nullif(p_quiz->>'max_attempts','')::INTEGER,3) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Maximum attempts must be between 1 and 20'; END IF;
  INSERT INTO public.quizzes(lesson_id, course_id, title, description, pass_percentage, time_limit_minutes, max_attempts, is_published)
  VALUES (p_lesson_id, v_lesson.course_id, trim(p_quiz->>'title'), nullif(trim(p_quiz->>'description'),''),
    COALESCE((p_quiz->>'pass_percentage')::INTEGER,70), nullif(p_quiz->>'time_limit_minutes','')::INTEGER,
    COALESCE(nullif(p_quiz->>'max_attempts','')::INTEGER,3), COALESCE((p_quiz->>'is_published')::BOOLEAN,FALSE))
  ON CONFLICT (lesson_id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, pass_percentage=EXCLUDED.pass_percentage,
    time_limit_minutes=EXCLUDED.time_limit_minutes, max_attempts=EXCLUDED.max_attempts, is_published=EXCLUDED.is_published, updated_at=now()
  RETURNING id INTO v_quiz_id;
  IF EXISTS (SELECT 1 FROM public.quiz_attempts WHERE quiz_id=v_quiz_id) THEN RAISE EXCEPTION USING ERRCODE='55000', MESSAGE='A quiz with student attempts cannot be structurally edited'; END IF;
  DELETE FROM public.questions WHERE quiz_id=v_quiz_id;
  FOR v_question IN SELECT value FROM jsonb_array_elements(p_quiz->'questions') LOOP
    IF char_length(trim(v_question->>'question_text')) < 3 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Every question requires text'; END IF;
    IF jsonb_array_length(COALESCE(v_question->'options','[]'::jsonb)) < 2 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Every question requires at least two options'; END IF;
    SELECT count(*) INTO v_correct FROM jsonb_array_elements(v_question->'options') o WHERE COALESCE((o->>'is_correct')::BOOLEAN,FALSE);
    IF v_correct <> 1 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Every question requires exactly one correct answer'; END IF;
    INSERT INTO public.questions(quiz_id,question_text,explanation,order_index,points,is_published)
    VALUES(v_quiz_id,trim(v_question->>'question_text'),nullif(trim(v_question->>'explanation'),''),v_question_index,COALESCE((v_question->>'points')::INTEGER,1),TRUE) RETURNING id INTO v_question_id;
    v_option_index := 0;
    FOR v_option IN SELECT value FROM jsonb_array_elements(v_question->'options') LOOP
      IF char_length(trim(v_option->>'option_text')) < 1 THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Answer choices cannot be empty'; END IF;
      INSERT INTO public.question_options(question_id,option_text,is_correct,order_index) VALUES(v_question_id,trim(v_option->>'option_text'),COALESCE((v_option->>'is_correct')::BOOLEAN,FALSE),v_option_index);
      v_option_index := v_option_index + 1;
    END LOOP;
    v_question_index := v_question_index + 1;
  END LOOP;
  RETURN v_quiz_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_author_quiz(UUID), public.author_save_quiz(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_author_quiz(UUID), public.author_save_quiz(UUID,JSONB) TO authenticated;

COMMIT;

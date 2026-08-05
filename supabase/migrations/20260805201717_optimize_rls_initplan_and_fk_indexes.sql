-- Wrap auth.uid()/auth.jwt() calls in (select ...) so they evaluate once per
-- statement instead of once per row (auth_rls_initplan advisor fix).
-- Predicate logic is unchanged; only the evaluation form changes.

-- users
ALTER POLICY "Allow users to update own profile" ON public.users
  USING ((select auth.uid()) = id);

ALTER POLICY "Allow insert on registration" ON public.users
  WITH CHECK ((select auth.uid()) = id);

-- lesson_progress
ALTER POLICY "Students can view own lesson progress" ON public.lesson_progress
  USING (user_id = (select auth.uid()));

ALTER POLICY "Students can create own enrolled progress" ON public.lesson_progress
  WITH CHECK ((user_id = (select auth.uid())) AND has_active_enrollment(course_id));

ALTER POLICY "Students can update own enrolled progress" ON public.lesson_progress
  USING ((user_id = (select auth.uid())) AND has_active_enrollment(course_id))
  WITH CHECK ((user_id = (select auth.uid())) AND has_active_enrollment(course_id));

-- course_orders
ALTER POLICY "Students can view own course orders" ON public.course_orders
  USING (user_id = (select auth.uid()));

ALTER POLICY "Admins can view course orders" ON public.course_orders
  USING ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

ALTER POLICY "Admins can update course order status" ON public.course_orders
  USING ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- quiz_attempts
ALTER POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  USING (user_id = (select auth.uid()));

-- question_attempts
ALTER POLICY "Users can view own question attempts" ON public.question_attempts
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = question_attempts.quiz_attempt_id
      AND qa.user_id = (select auth.uid())
  ));

-- Covering indexes for unindexed foreign keys (unindexed_foreign_keys advisor fix).
CREATE INDEX IF NOT EXISTS idx_course_orders_course_id
  ON public.course_orders (course_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_access_events_actor_id
  ON public.enrollment_access_events (actor_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_access_events_course_id
  ON public.enrollment_access_events (course_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_access_events_enrollment_id
  ON public.enrollment_access_events (enrollment_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_access_events_user_id
  ON public.enrollment_access_events (user_id);

CREATE INDEX IF NOT EXISTS idx_homepage_marketing_settings_updated_by
  ON public.homepage_marketing_settings (updated_by);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
  ON public.lesson_progress (lesson_id);

CREATE INDEX IF NOT EXISTS idx_platform_feature_releases_applied_by
  ON public.platform_feature_releases (applied_by);

CREATE INDEX IF NOT EXISTS idx_question_attempts_selected_option_id
  ON public.question_attempts (selected_option_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course_id
  ON public.quiz_attempts (course_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson_id
  ON public.quiz_attempts (lesson_id);

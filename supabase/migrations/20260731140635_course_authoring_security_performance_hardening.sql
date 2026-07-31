-- Harden the course-authoring API surface and remove the advisor findings on
-- the authoring/review tables without changing application semantics.
BEGIN;

ALTER FUNCTION public.generate_course_seo_title(TEXT) SET search_path='';
ALTER FUNCTION public.generate_course_seo_description(TEXT,TEXT,TEXT) SET search_path='';

DO $$
DECLARE f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef AND (
      left(p.proname,6)='admin_' OR
      left(p.proname,7)='author_' OR
      left(p.proname,11)='instructor_' OR
      p.proname IN ('submit_course_for_review','get_course_readiness','record_authoring_audit_event',
        'author_list_assignment_submissions','get_author_quiz','get_assignment_for_lesson',
        'grade_assignment','submit_assignment','start_quiz_attempt','save_quiz_answer',
        'submit_quiz_attempt','get_quiz_attempt_result','submit_instructor_application')
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
  END LOOP;

  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (
      'assert_course_matches_revision','course_snapshot','create_course_revision',
      'lock_course_workflow','lock_course_content_mutation','cleanup_replaced_course_cover',
      'recalculate_course_video_duration','sync_course_video_duration','sync_lesson_progress_course_id',
      'sync_quiz_attempt_relations','sync_quiz_lesson_and_course','set_updated_at','handle_new_user','rls_auto_enable',
      'get_course_readiness_v2_internal'
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS assignment_definitions_course_id_idx ON public.assignment_definitions(course_id);
CREATE INDEX IF NOT EXISTS assignment_submissions_graded_by_idx ON public.assignment_submissions(graded_by) WHERE graded_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS assignment_submissions_user_id_idx ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS course_review_events_actor_id_idx ON public.course_review_events(actor_id);
CREATE INDEX IF NOT EXISTS course_review_events_revision_id_idx ON public.course_review_events(revision_id) WHERE revision_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS course_review_findings_course_id_idx ON public.course_review_findings(course_id);
CREATE INDEX IF NOT EXISTS course_review_findings_reviewer_id_idx ON public.course_review_findings(reviewer_id);
CREATE INDEX IF NOT EXISTS course_revisions_created_by_idx ON public.course_revisions(created_by);
CREATE INDEX IF NOT EXISTS courses_approved_revision_id_idx ON public.courses(approved_revision_id) WHERE approved_revision_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS courses_review_assignee_id_idx ON public.courses(review_assignee_id) WHERE review_assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS courses_submitted_revision_id_idx ON public.courses(submitted_revision_id) WHERE submitted_revision_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lessons_course_section_idx ON public.lessons(course_id,section_id);

-- Replace overlapping permissive policies with one policy per command/role.
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Active students can view enrolled published courses" ON public.courses;
DROP POLICY IF EXISTS "Approved instructors view own courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view available courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Approved instructors update own drafts" ON public.courses;
CREATE POLICY "Anonymous users view public courses" ON public.courses FOR SELECT TO anon
  USING (status='published' AND COALESCE(visibility,'public')='public');
CREATE POLICY "Authenticated users view accessible courses" ON public.courses FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR
    (author_id=(SELECT auth.uid()) AND public.is_approved_instructor((SELECT auth.uid()))) OR
    (status='published' AND (COALESCE(visibility,'public') IN ('public','unlisted') OR public.has_active_enrollment(id))));
CREATE POLICY "Admins insert courses" ON public.courses FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Authorized users update courses" ON public.courses FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(id))
  WITH CHECK ((SELECT public.is_admin()) OR (author_id=(SELECT auth.uid()) AND status='draft'));
CREATE POLICY "Admins delete courses" ON public.courses FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage course sections" ON public.course_sections;
DROP POLICY IF EXISTS "Approved instructors manage own sections" ON public.course_sections;
DROP POLICY IF EXISTS "Active students can view published sections" ON public.course_sections;
CREATE POLICY "Authenticated users view accessible sections" ON public.course_sections FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id) OR (is_published AND public.has_active_enrollment(course_id)));
CREATE POLICY "Authorized users insert sections" ON public.course_sections FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR public.can_author_course(course_id));
CREATE POLICY "Authorized users update sections" ON public.course_sections FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id))
  WITH CHECK ((SELECT public.is_admin()) OR public.can_author_course(course_id));
CREATE POLICY "Authorized users delete sections" ON public.course_sections FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id));

DROP POLICY IF EXISTS "Admins can manage course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Approved instructors manage own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Active students can view published lessons" ON public.lessons;
CREATE POLICY "Authenticated users view accessible lessons" ON public.lessons FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id) OR (is_published AND public.has_active_enrollment(course_id)));
CREATE POLICY "Authorized users insert lessons" ON public.lessons FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR public.can_author_course(course_id));
CREATE POLICY "Authorized users update lessons" ON public.lessons FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id))
  WITH CHECK ((SELECT public.is_admin()) OR public.can_author_course(course_id));
CREATE POLICY "Authorized users delete lessons" ON public.lessons FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id));

DROP POLICY IF EXISTS "Admins view all course review history" ON public.course_review_events;
DROP POLICY IF EXISTS "Authors view own course review history" ON public.course_review_events;
CREATE POLICY "Authorized users view course review history" ON public.course_review_events FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_review_events.course_id AND c.author_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins view course revisions" ON public.course_revisions;
DROP POLICY IF EXISTS "Course authors view own revisions" ON public.course_revisions;
CREATE POLICY "Authorized users view course revisions" ON public.course_revisions FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_revisions.course_id AND c.author_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins manage review findings" ON public.course_review_findings;
DROP POLICY IF EXISTS "Authors view own review findings" ON public.course_review_findings;
CREATE POLICY "Authorized users view review findings" ON public.course_review_findings FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_review_findings.course_id AND c.author_id=(SELECT auth.uid())));
CREATE POLICY "Admins insert review findings" ON public.course_review_findings FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins update review findings" ON public.course_review_findings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins delete review findings" ON public.course_review_findings FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authors view own assignment definitions" ON public.assignment_definitions;
DROP POLICY IF EXISTS "Enrolled users view published assignments" ON public.assignment_definitions;
CREATE POLICY "Authenticated users view accessible assignments" ON public.assignment_definitions FOR SELECT TO authenticated
  USING (public.can_author_course(course_id) OR (is_published AND public.has_active_enrollment(course_id)));

DROP POLICY IF EXISTS "Authors view assignment submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students view own assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Authenticated users view accessible submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR EXISTS(SELECT 1 FROM public.assignment_definitions a WHERE a.id=assignment_id AND public.can_author_course(a.course_id)));

DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Enrolled students can view published quizzes" ON public.quizzes;
CREATE POLICY "Authenticated users view accessible quizzes" ON public.quizzes FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR public.can_author_course(course_id) OR (is_published AND public.has_active_enrollment(course_id)));
CREATE POLICY "Admins insert quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage instructor profiles" ON public.instructor_public_profiles;
DROP POLICY IF EXISTS "Public views approved instructor profiles" ON public.instructor_public_profiles;
CREATE POLICY "Anonymous users view public instructor profiles" ON public.instructor_public_profiles FOR SELECT TO anon USING (is_public);
CREATE POLICY "Authenticated users view instructor profiles" ON public.instructor_public_profiles FOR SELECT TO authenticated USING (is_public OR (SELECT public.is_admin()));
CREATE POLICY "Admins insert instructor profiles" ON public.instructor_public_profiles FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins update instructor profiles" ON public.instructor_public_profiles FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins delete instructor profiles" ON public.instructor_public_profiles FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

NOTIFY pgrst, 'reload schema';
COMMIT;

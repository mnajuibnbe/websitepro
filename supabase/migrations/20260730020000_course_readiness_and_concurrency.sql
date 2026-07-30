-- Phase 2: comprehensive publishability checks and serialized review decisions.
BEGIN;

CREATE OR REPLACE FUNCTION public.lock_course_workflow(p_course_id UUID) RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF p_course_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Course ID is required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_course_id::text, 0));
END $$;

-- Every content mutation takes the same transaction lock as submit, review, and
-- publication. A child-row write can therefore never race past a decision.
CREATE OR REPLACE FUNCTION public.lock_course_content_mutation() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_course_id UUID; v_row_id UUID;
BEGIN
  IF TG_TABLE_NAME='courses' THEN
    v_course_id:=CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END;
  ELSIF TG_TABLE_NAME IN ('course_sections','lessons','quizzes','assignment_definitions') THEN
    v_course_id:=CASE WHEN TG_OP='DELETE' THEN OLD.course_id ELSE NEW.course_id END;
  ELSIF TG_TABLE_NAME='questions' THEN
    v_row_id:=CASE WHEN TG_OP='DELETE' THEN OLD.quiz_id ELSE NEW.quiz_id END;
    SELECT course_id INTO v_course_id FROM public.quizzes WHERE id=v_row_id;
  ELSIF TG_TABLE_NAME='question_options' THEN
    v_row_id:=CASE WHEN TG_OP='DELETE' THEN OLD.question_id ELSE NEW.question_id END;
    SELECT q.course_id INTO v_course_id FROM public.questions qn JOIN public.quizzes q ON q.id=qn.quiz_id WHERE qn.id=v_row_id;
  END IF;
  IF v_course_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Course content must belong to a course'; END IF;
  PERFORM public.lock_course_workflow(v_course_id);
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_courses_workflow_lock ON public.courses;
CREATE TRIGGER trg_courses_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_sections_workflow_lock ON public.course_sections;
CREATE TRIGGER trg_sections_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.course_sections FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_lessons_workflow_lock ON public.lessons;
CREATE TRIGGER trg_lessons_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_quizzes_workflow_lock ON public.quizzes;
CREATE TRIGGER trg_quizzes_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_questions_workflow_lock ON public.questions;
CREATE TRIGGER trg_questions_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_question_options_workflow_lock ON public.question_options;
CREATE TRIGGER trg_question_options_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.question_options FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();
DROP TRIGGER IF EXISTS trg_assignments_workflow_lock ON public.assignment_definitions;
CREATE TRIGGER trg_assignments_workflow_lock BEFORE INSERT OR UPDATE OR DELETE ON public.assignment_definitions FOR EACH ROW EXECUTE FUNCTION public.lock_course_content_mutation();

CREATE OR REPLACE FUNCTION public.get_course_readiness(p_course_id UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  c public.courses; v_checks JSONB; v_published_sections INT; v_published_lessons INT;
  v_orphans INT; v_invalid_content INT; v_order_conflicts INT; v_invalid_quizzes INT;
BEGIN
  SELECT * INTO c FROM public.courses WHERE id=p_course_id;
  IF c.id IS NULL OR NOT (public.is_admin() OR c.author_id=auth.uid()) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Course access required'; END IF;

  SELECT count(*) INTO v_published_sections FROM public.course_sections WHERE course_id=c.id AND deleted_at IS NULL AND is_published;
  SELECT count(*) INTO v_published_lessons FROM public.lessons l JOIN public.course_sections s ON s.id=l.section_id
    WHERE l.course_id=c.id AND l.deleted_at IS NULL AND l.is_published AND s.deleted_at IS NULL AND s.is_published;
  SELECT count(*) INTO v_orphans FROM public.lessons l LEFT JOIN public.course_sections s ON s.id=l.section_id AND s.deleted_at IS NULL
    WHERE l.course_id=c.id AND l.deleted_at IS NULL AND (l.section_id IS NULL OR s.id IS NULL OR s.course_id<>c.id);
  SELECT count(*) INTO v_order_conflicts FROM (
    SELECT order_index FROM public.course_sections WHERE course_id=c.id AND deleted_at IS NULL GROUP BY order_index HAVING count(*)>1
    UNION ALL
    SELECT l.order_index FROM public.lessons l WHERE l.course_id=c.id AND l.deleted_at IS NULL GROUP BY l.section_id,l.order_index HAVING count(*)>1
  ) conflicts;
  SELECT count(*) INTO v_invalid_quizzes FROM public.quizzes q JOIN public.lessons l ON l.id=q.lesson_id
    WHERE q.course_id=c.id AND l.deleted_at IS NULL AND l.is_published AND (
      NOT q.is_published OR NOT EXISTS(SELECT 1 FROM public.questions qn WHERE qn.quiz_id=q.id AND qn.is_published) OR
      EXISTS(SELECT 1 FROM public.questions qn WHERE qn.quiz_id=q.id AND qn.is_published AND
        ((SELECT count(*) FROM public.question_options o WHERE o.question_id=qn.id)<2 OR
         (SELECT count(*) FROM public.question_options o WHERE o.question_id=qn.id AND o.is_correct)<>1))
    );
  SELECT count(*) INTO v_invalid_content FROM public.lessons l JOIN public.course_sections s ON s.id=l.section_id
    WHERE l.course_id=c.id AND l.deleted_at IS NULL AND l.is_published AND s.deleted_at IS NULL AND s.is_published AND (
      l.content_type IS NULL OR
      (l.content_type='video' AND (nullif(trim(l.video_url),'') IS NULL OR l.video_metadata_status IS DISTINCT FROM 'ready' OR COALESCE(l.video_duration_seconds,0)<=0)) OR
      (l.content_type='pdf' AND COALESCE(l.content_url,'') !~ '^https://[^[:space:]]+$') OR
      (l.content_type='external_link' AND COALESCE(l.content_url,'') !~ '^https://[^[:space:]]+$') OR
      (l.content_type='quiz' AND NOT EXISTS(SELECT 1 FROM public.quizzes q WHERE q.lesson_id=l.id AND q.is_published)) OR
      (l.content_type='assignment' AND NOT EXISTS(SELECT 1 FROM public.assignment_definitions a WHERE a.lesson_id=l.id AND a.is_published AND char_length(trim(a.instructions))>=20))
    );

  v_checks:=jsonb_build_array(
    jsonb_build_object('key','title','label','Course title','complete',char_length(trim(c.title))>=3,'detail','Use a title with at least 3 characters.','target','details'),
    jsonb_build_object('key','slug','label','Course URL','complete',nullif(trim(COALESCE(c.slug,'')),'') IS NOT NULL,'detail','Save a valid course URL slug.','target','details'),
    jsonb_build_object('key','summary','label','Course summary','complete',char_length(trim(COALESCE(c.short_description,'')))>=20,'detail','Add a summary with at least 20 characters.','target','details'),
    jsonb_build_object('key','description','label','Course description','complete',char_length(trim(COALESCE(c.description,'')))>=40,'detail','Add a description with at least 40 characters.','target','details'),
    jsonb_build_object('key','taxonomy','label','Category, level, and language','complete',nullif(trim(COALESCE(c.category,'')),'') IS NOT NULL AND c.level IN ('beginner','intermediate','advanced','all_levels') AND nullif(trim(COALESCE(c.language,'')),'') IS NOT NULL,'detail','Choose the governed category, level, and language.','target','details'),
    jsonb_build_object('key','cover','label','Managed course cover','complete',EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='course-covers' AND COALESCE(c.cover_image,c.thumbnail,'') LIKE '%/course-covers/' || o.name),'detail','Upload the cover through the course cover control.','target','details'),
    jsonb_build_object('key','pricing','label','Valid regional pricing','complete',c.price_egp IS NOT NULL AND c.price_usd IS NOT NULL AND c.price_egp>=0 AND c.price_usd>=0 AND ((c.price_egp=0 AND c.price_usd=0) OR (c.price_egp>0 AND c.price_usd>0)),'detail','Set valid EGP and USD prices; free courses must be zero in both.','target','pricing'),
    jsonb_build_object('key','instructor','label','Active approved instructor','complete',c.instructor_id IS NOT NULL AND public.is_approved_instructor(c.instructor_id) AND EXISTS(SELECT 1 FROM public.instructor_public_profiles ip WHERE ip.user_id=c.instructor_id AND ip.is_public),'detail','Assign an approved instructor with an active public profile.','target','details'),
    jsonb_build_object('key','sections','label','Published course section','complete',v_published_sections>0,'detail','Publish at least one non-deleted section.','target','curriculum'),
    jsonb_build_object('key','lessons','label','Published lesson','complete',v_published_lessons>0,'detail','Publish at least one lesson inside a published section.','target','curriculum'),
    jsonb_build_object('key','relationships','label','Curriculum relationships','complete',v_orphans=0,'detail','Move every lesson into a valid section in this course.','target','curriculum'),
    jsonb_build_object('key','ordering','label','Unique curriculum ordering','complete',v_order_conflicts=0,'detail','Reorder duplicate section or lesson positions.','target','curriculum'),
    jsonb_build_object('key','content','label','Lesson content is ready','complete',v_invalid_content=0,'detail','Complete every published lesson and verify all media.','target','curriculum'),
    jsonb_build_object('key','quizzes','label','Published quizzes are valid','complete',v_invalid_quizzes=0,'detail','Every quiz needs a published question with at least two choices and one correct answer.','target','curriculum')
  );
  RETURN jsonb_build_object('policy_version',2,'ready',NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_checks) x WHERE NOT (x->>'complete')::boolean),'checks',v_checks,
    'review_status',c.review_status,'authoring_status',c.authoring_status,'status',c.status,'submitted_revision_id',c.submitted_revision_id,'approved_revision_id',c.approved_revision_id,
    'reviewer_notes',(SELECT notes FROM public.course_review_events WHERE course_id=c.id AND event_type IN('changes_requested','rejected') ORDER BY created_at DESC LIMIT 1));
END $$;

CREATE OR REPLACE FUNCTION public.submit_course_for_review(p_course_id UUID,p_notes TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; readiness JSONB; revision public.course_revisions;
BEGIN
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.author_id<>auth.uid() OR NOT public.is_approved_instructor(auth.uid()) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Approved course owner required'; END IF;
  IF c.authoring_status<>'draft' OR c.review_status NOT IN('not_submitted','changes_requested','rejected') OR c.status<>'draft' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Course cannot be submitted from its current state'; END IF;
  readiness:=public.get_course_readiness(p_course_id);
  IF NOT (readiness->>'ready')::boolean THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Complete every readiness check before submission',DETAIL=readiness::text; END IF;
  revision:=public.create_course_revision(p_course_id);
  UPDATE public.courses SET authoring_status='in_review',review_status='submitted',submitted_revision_id=revision.id,approved_revision_id=NULL,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id) VALUES(p_course_id,auth.uid(),'submitted',nullif(trim(p_notes),''),revision.id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_course_review(p_course_id UUID,p_decision TEXT,p_notes TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; readiness JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  IF p_decision NOT IN('approved','changes_requested','rejected') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid review decision'; END IF;
  IF char_length(trim(COALESCE(p_notes,'')))<5 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='A review note of at least 5 characters is required for every decision'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.authoring_status<>'in_review' OR c.review_status<>'submitted' OR c.submitted_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='This course review is no longer actionable'; END IF;
  PERFORM public.assert_course_matches_revision(p_course_id,c.submitted_revision_id);
  IF p_decision='approved' THEN
    readiness:=public.get_course_readiness(p_course_id);
    IF NOT (readiness->>'ready')::boolean THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Course is no longer ready for approval',DETAIL=readiness::text; END IF;
  END IF;
  UPDATE public.courses SET authoring_status=CASE WHEN p_decision='approved' THEN 'approved' ELSE 'draft' END,review_status=p_decision,
    approved_revision_id=CASE WHEN p_decision='approved' THEN submitted_revision_id ELSE NULL END,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,notes,revision_id) VALUES(p_course_id,auth.uid(),p_decision,trim(p_notes),c.submitted_revision_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_course_publication(p_course_id UUID,p_publish BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; readiness JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Admin access required'; END IF;
  PERFORM public.lock_course_workflow(p_course_id);
  SELECT * INTO c FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Course not found'; END IF;
  IF p_publish THEN
    IF c.authoring_status<>'approved' OR c.review_status<>'approved' OR c.approved_revision_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='An approved course revision is required before publication'; END IF;
    PERFORM public.assert_course_matches_revision(p_course_id,c.approved_revision_id);
    readiness:=public.get_course_readiness(p_course_id);
    IF NOT (readiness->>'ready')::boolean THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Course is no longer ready for publication',DETAIL=readiness::text; END IF;
  ELSIF c.status<>'published' THEN RETURN;
  END IF;
  UPDATE public.courses SET status=CASE WHEN p_publish THEN 'published' ELSE 'draft' END,published_at=CASE WHEN p_publish THEN COALESCE(published_at,now()) ELSE published_at END,version=version+1,updated_at=now() WHERE id=p_course_id;
  INSERT INTO public.course_review_events(course_id,actor_id,event_type,revision_id) VALUES(p_course_id,auth.uid(),CASE WHEN p_publish THEN 'published' ELSE 'unpublished' END,c.approved_revision_id);
END $$;

REVOKE ALL ON FUNCTION public.lock_course_workflow(UUID), public.lock_course_content_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_course_readiness(UUID), public.submit_course_for_review(UUID,TEXT), public.admin_decide_course_review(UUID,TEXT,TEXT), public.admin_set_course_publication(UUID,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_readiness(UUID), public.submit_course_for_review(UUID,TEXT), public.admin_decide_course_review(UUID,TEXT,TEXT), public.admin_set_course_publication(UUID,BOOLEAN) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;

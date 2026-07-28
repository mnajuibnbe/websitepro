-- Phase 6: governed assignment authoring, submission, and grading.
BEGIN;
CREATE TABLE public.assignment_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id UUID NOT NULL UNIQUE REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE, instructions TEXT NOT NULL,
  due_at TIMESTAMPTZ NULL, max_points INTEGER NOT NULL DEFAULT 100 CHECK(max_points BETWEEN 1 AND 10000),
  allowed_submission TEXT NOT NULL DEFAULT 'text_or_link' CHECK(allowed_submission IN ('text','link','text_or_link')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id UUID NOT NULL REFERENCES public.assignment_definitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, submission_text TEXT NULL, submission_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','needs_revision','graded')),
  score INTEGER NULL CHECK(score >= 0), feedback TEXT NULL, submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ NULL, graded_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id,user_id)
);
CREATE INDEX assignment_submissions_assignment_status_idx ON public.assignment_submissions(assignment_id,status);
ALTER TABLE public.assignment_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors view own assignment definitions" ON public.assignment_definitions FOR SELECT TO authenticated USING(public.can_author_course(course_id));
CREATE POLICY "Enrolled users view published assignments" ON public.assignment_definitions FOR SELECT TO authenticated USING(is_published AND public.has_active_enrollment(course_id));
CREATE POLICY "Students view own assignment submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Authors view assignment submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.assignment_definitions a WHERE a.id=assignment_id AND public.can_author_course(a.course_id)));

CREATE FUNCTION public.author_save_assignment(p_lesson_id UUID,p_definition JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_lesson public.lessons; v_id UUID;
BEGIN
 SELECT * INTO v_lesson FROM public.lessons WHERE id=p_lesson_id AND deleted_at IS NULL FOR UPDATE;
 IF v_lesson.id IS NULL OR NOT public.can_author_course(v_lesson.course_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course author access required'; END IF;
 IF v_lesson.content_type <> 'assignment' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Lesson must use assignment content type'; END IF;
 IF char_length(trim(p_definition->>'instructions')) < 20 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Assignment instructions must contain at least 20 characters'; END IF;
 INSERT INTO public.assignment_definitions(lesson_id,course_id,instructions,due_at,max_points,allowed_submission,is_published)
 VALUES(p_lesson_id,v_lesson.course_id,trim(p_definition->>'instructions'),nullif(p_definition->>'due_at','')::timestamptz,COALESCE((p_definition->>'max_points')::int,100),COALESCE(p_definition->>'allowed_submission','text_or_link'),COALESCE((p_definition->>'is_published')::boolean,false))
 ON CONFLICT(lesson_id) DO UPDATE SET instructions=EXCLUDED.instructions,due_at=EXCLUDED.due_at,max_points=EXCLUDED.max_points,allowed_submission=EXCLUDED.allowed_submission,is_published=EXCLUDED.is_published,updated_at=now()
 RETURNING id INTO v_id; RETURN v_id;
END $$;
CREATE FUNCTION public.get_assignment_for_lesson(p_lesson_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id',a.id,'instructions',a.instructions,'due_at',a.due_at,'max_points',a.max_points,'allowed_submission',a.allowed_submission,'is_published',a.is_published,'submission',(SELECT jsonb_build_object('status',s.status,'submission_text',s.submission_text,'submission_url',s.submission_url,'score',s.score,'feedback',s.feedback,'submitted_at',s.submitted_at) FROM public.assignment_submissions s WHERE s.assignment_id=a.id AND s.user_id=auth.uid())) END
 FROM public.assignment_definitions a WHERE a.lesson_id=p_lesson_id AND (public.can_author_course(a.course_id) OR (a.is_published AND public.has_active_enrollment(a.course_id)));
$$;
CREATE FUNCTION public.submit_assignment(p_assignment_id UUID,p_text TEXT,p_url TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_assignment public.assignment_definitions; v_id UUID;
BEGIN
 SELECT * INTO v_assignment FROM public.assignment_definitions WHERE id=p_assignment_id AND is_published FOR UPDATE;
 IF auth.uid() IS NULL OR v_assignment.id IS NULL OR NOT public.has_active_enrollment(v_assignment.course_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Active enrollment required'; END IF;
 IF v_assignment.due_at IS NOT NULL AND now()>v_assignment.due_at THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Assignment due date has passed'; END IF;
 IF nullif(trim(p_text),'') IS NULL AND nullif(trim(p_url),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Add submission text or a link'; END IF;
 IF nullif(trim(p_url),'') IS NOT NULL AND p_url !~ '^https://[^[:space:]]+$' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Submission link must use HTTPS'; END IF;
 INSERT INTO public.assignment_submissions(assignment_id,user_id,submission_text,submission_url,status,submitted_at)
 VALUES(p_assignment_id,auth.uid(),nullif(trim(p_text),''),nullif(trim(p_url),''),'submitted',now())
 ON CONFLICT(assignment_id,user_id) DO UPDATE SET submission_text=EXCLUDED.submission_text,submission_url=EXCLUDED.submission_url,status='submitted',score=NULL,feedback=NULL,graded_at=NULL,graded_by=NULL,submitted_at=now(),updated_at=now()
 WHERE assignment_submissions.status='needs_revision' RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='This assignment was already submitted'; END IF; RETURN v_id;
END $$;
CREATE FUNCTION public.grade_assignment(p_submission_id UUID,p_score INTEGER,p_feedback TEXT,p_needs_revision BOOLEAN DEFAULT FALSE) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_submission public.assignment_submissions; v_assignment public.assignment_definitions;
BEGIN
 SELECT * INTO v_submission FROM public.assignment_submissions WHERE id=p_submission_id FOR UPDATE;
 SELECT * INTO v_assignment FROM public.assignment_definitions WHERE id=v_submission.assignment_id;
 IF v_submission.id IS NULL OR NOT public.can_author_course(v_assignment.course_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Course author access required'; END IF;
 IF NOT p_needs_revision AND (p_score IS NULL OR p_score<0 OR p_score>v_assignment.max_points) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Score is outside the assignment range'; END IF;
 UPDATE public.assignment_submissions SET status=CASE WHEN p_needs_revision THEN 'needs_revision' ELSE 'graded' END,score=CASE WHEN p_needs_revision THEN NULL ELSE p_score END,feedback=nullif(trim(p_feedback),''),graded_at=now(),graded_by=auth.uid(),updated_at=now() WHERE id=p_submission_id;
 IF NOT p_needs_revision THEN INSERT INTO public.lesson_progress(user_id,course_id,lesson_id,is_completed,completed_at,last_accessed_at) VALUES(v_submission.user_id,v_assignment.course_id,v_assignment.lesson_id,true,now(),now()) ON CONFLICT(user_id,lesson_id) DO UPDATE SET is_completed=true,completed_at=COALESCE(public.lesson_progress.completed_at,now()),updated_at=now(); END IF;
END $$;
CREATE FUNCTION public.author_list_assignment_submissions(p_lesson_id UUID) RETURNS TABLE(id UUID,student_name TEXT,student_email TEXT,submission_text TEXT,submission_url TEXT,status TEXT,score INTEGER,feedback TEXT,submitted_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT s.id,u.full_name,u.email,s.submission_text,s.submission_url,s.status,s.score,s.feedback,s.submitted_at FROM public.assignment_definitions a JOIN public.assignment_submissions s ON s.assignment_id=a.id JOIN public.users u ON u.id=s.user_id WHERE a.lesson_id=p_lesson_id AND public.can_author_course(a.course_id) ORDER BY s.submitted_at;
$$;
REVOKE ALL ON FUNCTION public.author_save_assignment(UUID,JSONB),public.get_assignment_for_lesson(UUID),public.submit_assignment(UUID,TEXT,TEXT),public.grade_assignment(UUID,INTEGER,TEXT,BOOLEAN),public.author_list_assignment_submissions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.author_save_assignment(UUID,JSONB),public.get_assignment_for_lesson(UUID),public.submit_assignment(UUID,TEXT,TEXT),public.grade_assignment(UUID,INTEGER,TEXT,BOOLEAN),public.author_list_assignment_submissions(UUID) TO authenticated;
COMMIT;

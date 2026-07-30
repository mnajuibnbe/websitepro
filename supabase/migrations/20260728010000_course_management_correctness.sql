-- Phase 1: safe public curriculum projection and auditable enrollment revocation.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_course_curriculum(p_course_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(section_payload ORDER BY section_order), '[]'::jsonb)
  FROM (
    SELECT s.order_index AS section_order, jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'description', s.description,
      'order_index', s.order_index,
      'lesson_count', count(l.id),
      'total_minutes', COALESCE(sum(CASE WHEN l.content_type = 'video' THEN l.estimated_minutes ELSE 0 END), 0),
      'lessons', COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'content_type', COALESCE(l.content_type, CASE WHEN l.type = 'quiz' THEN 'quiz' WHEN l.type = 'text' THEN 'pdf' ELSE 'video' END),
        'estimated_minutes', l.estimated_minutes,
        'is_preview', l.is_preview,
        'order_index', l.order_index
      ) ORDER BY l.order_index) FILTER (WHERE l.id IS NOT NULL), '[]'::jsonb)
    ) AS section_payload
    FROM public.course_sections s
    JOIN public.courses c ON c.id = s.course_id
    LEFT JOIN public.lessons l ON l.section_id = s.id
      AND l.course_id = c.id AND l.is_published = TRUE AND l.deleted_at IS NULL
    WHERE c.id = p_course_id AND c.status = 'published'
      AND COALESCE(c.visibility, 'public') = 'public'
      AND s.is_published = TRUE AND s.deleted_at IS NULL
    GROUP BY s.id, s.title, s.description, s.order_index
  ) public_sections;
$$;

REVOKE ALL ON FUNCTION public.get_public_course_curriculum(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_course_curriculum(UUID) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.enrollment_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('revoked', 'reactivated')),
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 500),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.enrollment_access_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view enrollment access events" ON public.enrollment_access_events
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_get_course_enrollments(p_course_id UUID)
RETURNS TABLE (
  enrollment_id UUID, user_id UUID, student_name TEXT, student_email TEXT,
  status TEXT, enrolled_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.user_id, COALESCE(u.full_name, 'Unnamed student'), COALESCE(u.email, ''), e.status, e.enrolled_at
  FROM public.enrollments e JOIN public.users u ON u.id = e.user_id
  WHERE public.is_admin() AND e.course_id = p_course_id
  ORDER BY e.enrolled_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_enrollment_access(
  p_enrollment_id UUID, p_active BOOLEAN, p_reason TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_enrollment public.enrollments; v_new_status TEXT; v_actor UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required'; END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'A reason is required';
  END IF;
  SELECT * INTO v_enrollment FROM public.enrollments WHERE id = p_enrollment_id FOR UPDATE;
  IF v_enrollment.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Enrollment not found'; END IF;
  v_new_status := CASE WHEN p_active THEN 'active' ELSE 'cancelled' END;
  IF v_enrollment.status = v_new_status THEN RETURN v_new_status; END IF;
  UPDATE public.enrollments SET status = v_new_status WHERE id = v_enrollment.id;
  INSERT INTO public.enrollment_access_events (
    enrollment_id, course_id, user_id, actor_id, action, reason, previous_status, new_status
  ) VALUES (
    v_enrollment.id, v_enrollment.course_id, v_enrollment.user_id, v_actor,
    CASE WHEN p_active THEN 'reactivated' ELSE 'revoked' END, trim(p_reason), v_enrollment.status, v_new_status
  );
  RETURN v_new_status;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_course_enrollments(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_enrollment_access(UUID,BOOLEAN,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_course_enrollments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_enrollment_access(UUID,BOOLEAN,TEXT) TO authenticated;

COMMIT;

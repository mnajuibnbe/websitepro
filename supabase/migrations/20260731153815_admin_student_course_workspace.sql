-- Admin-only, bounded student account data for the user-management workspace.
-- The functions intentionally expose only operational fields needed by admins;
-- raw auth records and internal identifiers are not returned to the UI.

CREATE OR REPLACE FUNCTION public.admin_list_students(
  p_search TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  email TEXT,
  joined_at TIMESTAMPTZ,
  active_courses BIGINT,
  total_courses BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 200 OR p_offset < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid student list pagination';
  END IF;

  RETURN QUERY
  WITH student_rows AS (
    SELECT
      u.id AS student_id,
      u.full_name,
      u.email,
      u.created_at AS joined_at,
      COUNT(e.id) FILTER (WHERE e.status = 'active') AS active_courses,
      COUNT(e.id) AS total_courses
    FROM public.users u
    LEFT JOIN public.enrollments e ON e.user_id = u.id
    WHERE u.role = 'student'::public.user_role
      AND (
        NULLIF(BTRIM(COALESCE(p_search, '')), '') IS NULL
        OR u.full_name ILIKE '%' || BTRIM(p_search) || '%'
        OR u.email ILIKE '%' || BTRIM(p_search) || '%'
      )
    GROUP BY u.id, u.full_name, u.email, u.created_at
  )
  SELECT
    s.student_id,
    s.full_name,
    s.email,
    s.joined_at,
    s.active_courses,
    s.total_courses,
    COUNT(*) OVER () AS total_count
  FROM student_rows s
  ORDER BY s.joined_at DESC, s.student_id
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_student_course_workspace(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student public.users%ROWTYPE;
  v_courses JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin access required';
  END IF;

  SELECT * INTO v_student
  FROM public.users
  WHERE id = p_student_id AND role = 'student'::public.user_role;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Student account not found';
  END IF;

  SELECT COALESCE(JSONB_AGG(course_row.payload ORDER BY course_row.sort_order, course_row.enrolled_at DESC), '[]'::JSONB)
  INTO v_courses
  FROM (
    SELECT
      CASE WHEN e.status = 'active' THEN 0 ELSE 1 END AS sort_order,
      e.enrolled_at,
      JSONB_BUILD_OBJECT(
        'enrollment_id', e.id,
        'course_id', c.id,
        'title', c.title,
        'slug', c.slug,
        'course_status', c.status,
        'access_status', COALESCE(e.status, 'unknown'),
        'enrolled_at', e.enrolled_at,
        'completed_lessons', COALESCE(progress.completed_lessons, 0),
        'total_lessons', COALESCE(curriculum.total_lessons, 0),
        'last_accessed_at', progress.last_accessed_at,
        'payment_status', latest_order.payment_status,
        'amount', latest_order.amount,
        'currency', latest_order.currency
      ) AS payload
    FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE lp.is_completed) AS completed_lessons,
        MAX(lp.last_accessed_at) AS last_accessed_at
      FROM public.lesson_progress lp
      WHERE lp.user_id = e.user_id AND lp.course_id = e.course_id
    ) progress ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS total_lessons
      FROM public.lessons l
      WHERE l.course_id = e.course_id AND l.deleted_at IS NULL AND l.is_published
    ) curriculum ON TRUE
    LEFT JOIN LATERAL (
      SELECT o.payment_status, o.amount, o.currency
      FROM public.course_orders o
      WHERE o.user_id = e.user_id AND o.course_id = e.course_id
      ORDER BY o.created_at DESC
      LIMIT 1
    ) latest_order ON TRUE
    WHERE e.user_id = p_student_id
  ) course_row;

  RETURN JSONB_BUILD_OBJECT(
    'student', JSONB_BUILD_OBJECT(
      'name', v_student.full_name,
      'email', v_student.email,
      'joined_at', v_student.created_at
    ),
    'summary', JSONB_BUILD_OBJECT(
      'active_courses', (SELECT COUNT(*) FROM public.enrollments e WHERE e.user_id = p_student_id AND e.status = 'active'),
      'total_courses', (SELECT COUNT(*) FROM public.enrollments e WHERE e.user_id = p_student_id),
      'last_activity_at', (SELECT MAX(lp.last_accessed_at) FROM public.lesson_progress lp WHERE lp.user_id = p_student_id)
    ),
    'courses', v_courses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_students(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_student_course_workspace(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_students(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_student_course_workspace(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

export const PUBLIC_COURSE_STATUS = 'published' as const;
export const ACTIVE_ENROLLMENT_STATUS = 'active' as const;

export function isHomeCourse(course: { status?: string | null; is_featured?: boolean | null }): boolean {
  return course.status === PUBLIC_COURSE_STATUS && course.is_featured === true;
}

export function isActiveEnrollment(enrollment: { status?: string | null }): boolean {
  return enrollment.status === ACTIVE_ENROLLMENT_STATUS;
}

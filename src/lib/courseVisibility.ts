export const PUBLIC_COURSE_STATUS = 'published' as const;
export const ACTIVE_ENROLLMENT_STATUS = 'active' as const;

export function isHomeCourse(course: { status?: string | null }): boolean {
  return course.status === PUBLIC_COURSE_STATUS;
}

export function isActiveEnrollment(enrollment: { status?: string | null }): boolean {
  return enrollment.status === ACTIVE_ENROLLMENT_STATUS;
}

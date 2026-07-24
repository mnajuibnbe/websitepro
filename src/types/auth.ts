export type Role = 'student' | 'instructor' | 'admin';

export enum Permission {
  // Authenticated student permissions
  MANAGE_OWN_PROFILE = 'profile:manage_own',
  VIEW_ENROLLED_COURSES = 'course:view_enrolled',
  VIEW_ENROLLED_LESSONS = 'lesson:view_enrolled',
  UPDATE_OWN_PROGRESS = 'progress:update_own',
  TAKE_QUIZ = 'quiz:take',

  // Instructor future permissions
  INSTRUCTOR_ACCESS = 'instructor:access',
  CREATE_COURSE = 'course:create',
  VIEW_OWN_COURSE = 'course:view_own',
  UPDATE_OWN_COURSE = 'course:update_own',
  MANAGE_OWN_LESSON = 'lesson:manage_own',
  VIEW_OWN_ENROLLED_STUDENTS = 'student:view_enrolled_own',
  VIEW_OWN_ANALYTICS = 'analytics:view_own',

  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  MANAGE_ANY_COURSE = 'course:manage_any',
  MANAGE_ANY_USER = 'user:manage_any',
  MANAGE_INSTRUCTORS = 'instructor:manage',
  VIEW_PLATFORM_ANALYTICS = 'analytics:view_platform',
  MANAGE_SETTINGS = 'settings:manage',
}

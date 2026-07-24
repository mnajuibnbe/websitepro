import { Role, Permission } from '../types/auth';

type PermissionMatrix = {
  [key in Role]: Permission[];
};

export const PERMISSIONS: PermissionMatrix = {
  student: [
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_ENROLLED_COURSES,
    Permission.VIEW_ENROLLED_LESSONS,
    Permission.UPDATE_OWN_PROGRESS,
    Permission.TAKE_QUIZ,
  ],
  instructor: [
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_ENROLLED_COURSES,
    Permission.VIEW_ENROLLED_LESSONS,
    Permission.UPDATE_OWN_PROGRESS,
    Permission.TAKE_QUIZ,
    Permission.INSTRUCTOR_ACCESS,
    Permission.CREATE_COURSE,
    Permission.VIEW_OWN_COURSE,
    Permission.UPDATE_OWN_COURSE,
    Permission.MANAGE_OWN_LESSON,
    Permission.VIEW_OWN_ENROLLED_STUDENTS,
    Permission.VIEW_OWN_ANALYTICS,
  ],
  admin: [
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_ENROLLED_COURSES,
    Permission.VIEW_ENROLLED_LESSONS,
    Permission.UPDATE_OWN_PROGRESS,
    Permission.TAKE_QUIZ,
    Permission.INSTRUCTOR_ACCESS,
    Permission.CREATE_COURSE,
    Permission.VIEW_OWN_COURSE,
    Permission.UPDATE_OWN_COURSE,
    Permission.MANAGE_OWN_LESSON,
    Permission.VIEW_OWN_ENROLLED_STUDENTS,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.ADMIN_ACCESS,
    Permission.MANAGE_ANY_COURSE,
    Permission.MANAGE_ANY_USER,
    Permission.MANAGE_INSTRUCTORS,
    Permission.VIEW_PLATFORM_ANALYTICS,
    Permission.MANAGE_SETTINGS,
  ],
};

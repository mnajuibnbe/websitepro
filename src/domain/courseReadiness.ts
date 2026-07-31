export const COURSE_SUMMARY_MIN_LENGTH = 20;
export const COURSE_DESCRIPTION_MIN_LENGTH = 40;

export type CourseReadinessTarget = 'details' | 'pricing' | 'curriculum' | 'review';

export interface CourseReadinessItem {
  id?: string;
  label: string;
  detail?: string;
  target?: CourseReadinessTarget;
}

export interface CourseReadinessCheck {
  key: string;
  label: string;
  complete: boolean;
  detail?: string;
  target?: CourseReadinessTarget;
  items?: CourseReadinessItem[];
}

export interface CourseReadinessAction {
  allowed: boolean;
  reason?: string | null;
}

export interface CourseReadiness {
  policy_version?: number;
  ready: boolean;
  checks: CourseReadinessCheck[];
  review_status: string;
  authoring_status: string;
  status: string;
  reviewer_notes: string | null;
  allowed_actions?: Record<string, CourseReadinessAction>;
}

export function readinessTargetHref(courseId: string, target?: CourseReadinessTarget): string {
  if (target === 'details') return `/admin/courses/${courseId}/edit`;
  if (target === 'pricing') return `/admin/courses/${courseId}/builder?tab=pricing`;
  if (target === 'review') return `/admin/courses/${courseId}/builder?tab=publish`;
  return `/admin/courses/${courseId}/builder?tab=curriculum`;
}

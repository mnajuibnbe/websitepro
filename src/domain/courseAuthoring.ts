export const COURSE_AUTHORING_STATUSES = ['draft', 'in_review', 'approved', 'archived'] as const;
export type CourseAuthoringStatus = (typeof COURSE_AUTHORING_STATUSES)[number];

export const COURSE_REVIEW_STATUSES = ['not_submitted', 'submitted', 'changes_requested', 'approved', 'rejected'] as const;
export type CourseReviewStatus = (typeof COURSE_REVIEW_STATUSES)[number];

export const COURSE_VISIBILITIES = ['public', 'unlisted', 'private'] as const;
export type CourseVisibility = (typeof COURSE_VISIBILITIES)[number];

export const LESSON_CONTENT_TYPES = ['video', 'pdf', 'external_link', 'quiz', 'assignment'] as const;
export type LessonContentType = (typeof LESSON_CONTENT_TYPES)[number];

export const LESSON_COMPLETION_RULES = ['manual', 'watch90', 'open_resource', 'pass_quiz', 'upload_assignment'] as const;
export type LessonCompletionRule = (typeof LESSON_COMPLETION_RULES)[number];

const CONTENT_TYPE_SET = new Set<string>(LESSON_CONTENT_TYPES);

export function isLessonContentType(value: unknown): value is LessonContentType {
  return typeof value === 'string' && CONTENT_TYPE_SET.has(value);
}

export function defaultCompletionRule(type: LessonContentType): LessonCompletionRule {
  switch (type) {
    case 'video': return 'watch90';
    case 'pdf':
    case 'external_link': return 'open_resource';
    case 'quiz': return 'pass_quiz';
    case 'assignment': return 'upload_assignment';
  }
}

export function canTransitionReviewStatus(from: CourseReviewStatus, to: CourseReviewStatus): boolean {
  const transitions: Record<CourseReviewStatus, readonly CourseReviewStatus[]> = {
    not_submitted: ['submitted'],
    submitted: ['changes_requested', 'approved', 'rejected'],
    changes_requested: ['submitted'],
    approved: ['changes_requested'],
    rejected: ['submitted'],
  };
  return transitions[from].includes(to);
}

export function legacyLessonTypeToCanonical(type: string | null | undefined): LessonContentType | null {
  if (!type) return null;
  if (isLessonContentType(type)) return type;
  if (type === 'link') return 'external_link';
  return null;
}

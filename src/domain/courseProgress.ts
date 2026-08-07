export interface ProgressSection {
  id: string;
  course_id: string;
  order_index: number;
  is_published: boolean;
  deleted_at?: string | null;
}

export interface ProgressLesson {
  id: string;
  course_id: string;
  section_id: string | null;
  order_index: number;
  is_published: boolean;
  deleted_at?: string | null;
  title: string;
}

export interface ProgressRow {
  course_id: string;
  lesson_id: string;
  is_completed: boolean;
  last_accessed_at: string;
}

export interface CourseEnrollment {
  courseId: string;
  enrolledAt: string;
}

export interface ProgressCourse {
  id: string;
  title: string;
}

export interface CourseProgressSummary {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  hasStarted: boolean;
  lastAccessedAt: string | null;
}

function isSectionValid(section: ProgressSection): boolean {
  return section.is_published && !section.deleted_at;
}

function isLessonValid(lesson: ProgressLesson, validSectionIds: Set<string>): boolean {
  if (!lesson.is_published || lesson.deleted_at) return false;
  if (!lesson.section_id) return true;
  return validSectionIds.has(lesson.section_id);
}

/** Lessons eligible to count toward progress: published, not soft-deleted, and (if sectioned) inside a published, not soft-deleted section. */
export function selectValidLessons(lessons: ProgressLesson[], sections: ProgressSection[]): ProgressLesson[] {
  const validSectionIds = new Set(sections.filter(isSectionValid).map((s) => s.id));
  return lessons.filter((l) => isLessonValid(l, validSectionIds));
}

export function orderLessonsBySectionThenIndex<T extends { id: string; section_id: string | null; order_index: number }>(
  lessons: T[],
  sections: { id: string; order_index: number }[]
): T[] {
  const sectionOrder = new Map(sections.map((s) => [s.id, s.order_index]));
  return [...lessons].sort((a, b) => {
    const orderA = a.section_id != null ? sectionOrder.get(a.section_id) ?? 0 : 0;
    const orderB = b.section_id != null ? sectionOrder.get(b.section_id) ?? 0 : 0;
    if (orderA !== orderB) return orderA - orderB;
    if (a.order_index !== b.order_index) return a.order_index - b.order_index;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Progress per course: total/completed counts only include valid (published, non-deleted)
 * lessons, so soft-deleted or unpublished lessons never distort the percentage.
 */
export function computeCourseProgressSummaries(
  courseIds: string[],
  lessons: ProgressLesson[],
  sections: ProgressSection[],
  progressRows: ProgressRow[]
): Record<string, CourseProgressSummary> {
  const validLessons = selectValidLessons(lessons, sections);
  const validLessonIdsByCourse = new Map<string, Set<string>>();
  courseIds.forEach((id) => validLessonIdsByCourse.set(id, new Set()));
  validLessons.forEach((lesson) => {
    const set = validLessonIdsByCourse.get(lesson.course_id);
    if (set) set.add(lesson.id);
  });

  const result: Record<string, CourseProgressSummary> = {};

  courseIds.forEach((courseId) => {
    const validIds = validLessonIdsByCourse.get(courseId) ?? new Set<string>();
    const relevantRows = progressRows.filter((row) => row.course_id === courseId && validIds.has(row.lesson_id));

    const totalLessons = validIds.size;
    const completedLessons = relevantRows.filter((row) => row.is_completed).length;
    const rawPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const percentage = Math.min(100, Math.max(0, rawPercentage));

    let lastAccessedAt: string | null = null;
    relevantRows.forEach((row) => {
      if (!lastAccessedAt || new Date(row.last_accessed_at).getTime() > new Date(lastAccessedAt).getTime()) {
        lastAccessedAt = row.last_accessed_at;
      }
    });

    result[courseId] = {
      courseId,
      totalLessons,
      completedLessons,
      percentage,
      hasStarted: relevantRows.length > 0,
      lastAccessedAt,
    };
  });

  return result;
}

export interface ResumeLessonTarget {
  lessonId: string;
  title: string;
}

/**
 * Picks the lesson to resume into, in priority order: the most recently accessed
 * incomplete lesson, else the first incomplete lesson in course order, else the
 * last lesson (course fully complete, e.g. for review), else the first lesson.
 */
export function resolveResumeLesson(orderedValidLessons: ProgressLesson[], progressRows: ProgressRow[]): ResumeLessonTarget | null {
  if (orderedValidLessons.length === 0) return null;

  const incomplete = progressRows
    .filter((row) => !row.is_completed)
    .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime());

  for (const row of incomplete) {
    const lesson = orderedValidLessons.find((l) => l.id === row.lesson_id);
    if (lesson) return { lessonId: lesson.id, title: lesson.title };
  }

  const completedIds = new Set(progressRows.filter((row) => row.is_completed).map((row) => row.lesson_id));
  const firstIncomplete = orderedValidLessons.find((l) => !completedIds.has(l.id));
  if (firstIncomplete) return { lessonId: firstIncomplete.id, title: firstIncomplete.title };

  const last = orderedValidLessons[orderedValidLessons.length - 1];
  return { lessonId: last.id, title: last.title };
}

export type ContinueLearningTarget =
  | { status: 'no_enrollments' }
  | {
      status: 'in_progress';
      course: ProgressCourse;
      lessonId: string;
      lessonTitle: string;
      completedLessons: number;
      totalLessons: number;
      percentage: number;
    }
  | {
      status: 'not_started';
      course: ProgressCourse;
      lessonId: string | null;
      lessonTitle: string | null;
      totalLessons: number;
    }
  | {
      status: 'all_completed';
      course: ProgressCourse;
      completedLessons: number;
      totalLessons: number;
    };

/**
 * Picks what the "Continue learning" dashboard section should show:
 * 1. The in-progress (started, <100%) course most recently accessed, resuming the exact lesson.
 * 2. Else the most recently enrolled course that hasn't been started yet.
 * 3. Else the most recently completed course (every enrollment is at 100%).
 * 4. Else no enrollments.
 */
export function resolveContinueLearningTarget(
  enrollments: CourseEnrollment[],
  courses: ProgressCourse[],
  lessons: ProgressLesson[],
  sections: ProgressSection[],
  progressRows: ProgressRow[]
): ContinueLearningTarget {
  if (enrollments.length === 0) return { status: 'no_enrollments' };

  const courseIds = enrollments.map((e) => e.courseId);
  const summaries = computeCourseProgressSummaries(courseIds, lessons, sections, progressRows);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const validLessons = selectValidLessons(lessons, sections);

  const orderedLessonsFor = (courseId: string): ProgressLesson[] =>
    orderLessonsBySectionThenIndex(
      validLessons.filter((l) => l.course_id === courseId),
      sections.filter((s) => s.course_id === courseId)
    );

  const inProgress = enrollments
    .filter((e) => summaries[e.courseId]?.hasStarted && summaries[e.courseId].percentage < 100)
    .sort((a, b) => {
      const at = summaries[a.courseId].lastAccessedAt ? new Date(summaries[a.courseId].lastAccessedAt as string).getTime() : 0;
      const bt = summaries[b.courseId].lastAccessedAt ? new Date(summaries[b.courseId].lastAccessedAt as string).getTime() : 0;
      return bt - at;
    });

  if (inProgress.length > 0) {
    const enrollment = inProgress[0];
    const course = courseById.get(enrollment.courseId);
    const summary = summaries[enrollment.courseId];
    const resume = resolveResumeLesson(
      orderedLessonsFor(enrollment.courseId),
      progressRows.filter((row) => row.course_id === enrollment.courseId)
    );
    if (course && resume) {
      return {
        status: 'in_progress',
        course,
        lessonId: resume.lessonId,
        lessonTitle: resume.title,
        completedLessons: summary.completedLessons,
        totalLessons: summary.totalLessons,
        percentage: summary.percentage,
      };
    }
  }

  const notStarted = enrollments
    .filter((e) => summaries[e.courseId] && !summaries[e.courseId].hasStarted)
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

  if (notStarted.length > 0) {
    const enrollment = notStarted[0];
    const course = courseById.get(enrollment.courseId);
    const summary = summaries[enrollment.courseId];
    const firstLesson = orderedLessonsFor(enrollment.courseId)[0] ?? null;
    if (course) {
      return {
        status: 'not_started',
        course,
        lessonId: firstLesson?.id ?? null,
        lessonTitle: firstLesson?.title ?? null,
        totalLessons: summary.totalLessons,
      };
    }
  }

  const completed = enrollments
    .filter((e) => summaries[e.courseId])
    .sort((a, b) => {
      const summaryA = summaries[a.courseId];
      const summaryB = summaries[b.courseId];
      const at = summaryA.lastAccessedAt ? new Date(summaryA.lastAccessedAt).getTime() : new Date(a.enrolledAt).getTime();
      const bt = summaryB.lastAccessedAt ? new Date(summaryB.lastAccessedAt).getTime() : new Date(b.enrolledAt).getTime();
      return bt - at;
    });

  if (completed.length > 0) {
    const enrollment = completed[0];
    const course = courseById.get(enrollment.courseId);
    const summary = summaries[enrollment.courseId];
    if (course) {
      return {
        status: 'all_completed',
        course,
        completedLessons: summary.completedLessons,
        totalLessons: summary.totalLessons,
      };
    }
  }

  return { status: 'no_enrollments' };
}

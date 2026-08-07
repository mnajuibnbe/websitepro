import { supabase } from './supabase';
import {
  computeCourseProgressSummaries,
  resolveContinueLearningTarget,
  type ContinueLearningTarget,
  type ProgressLesson,
  type ProgressRow,
  type ProgressSection,
} from '../domain/courseProgress';

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export type { ContinueLearningTarget } from '../domain/courseProgress';

/**
 * Calculates course progress for a user across one or multiple course IDs.
 *
 * Rules:
 * - count only lessons where lessons.is_published = true
 * - count only lessons inside sections where course_sections.is_published = true (or section_id is null)
 * - include quiz lessons in total
 * - count a lesson/quiz only when lesson_progress.is_completed = true
 * - avoid divide-by-zero
 * - clamp percentage between 0 and 100
 * - round consistently using Math.round
 */
export async function fetchCoursesProgress(
  userId: string,
  courseIds: string[]
): Promise<Record<string, CourseProgress>> {
  if (!userId || !courseIds || courseIds.length === 0) {
    return {};
  }

  const cleanCourseIds = Array.from(new Set(courseIds.filter(Boolean)));
  if (cleanCourseIds.length === 0) return {};

  try {
    // 1. Fetch published, non-deleted sections for these courses
    const { data: sectionsData, error: sectionsErr } = await supabase
      .from('course_sections')
      .select('id, course_id, order_index, is_published, deleted_at')
      .in('course_id', cleanCourseIds)
      .eq('is_published', true)
      .is('deleted_at', null);

    if (sectionsErr) {
      console.error('Error fetching course_sections for progress:', sectionsErr);
      throw sectionsErr;
    }

    // 2. Fetch published, non-deleted lessons for these courses
    const { data: lessonsData, error: lessonsErr } = await supabase
      .from('lessons')
      .select('id, course_id, section_id, order_index, is_published, deleted_at')
      .in('course_id', cleanCourseIds)
      .eq('is_published', true)
      .is('deleted_at', null);

    if (lessonsErr) {
      console.error('Error fetching lessons for progress:', lessonsErr);
      throw lessonsErr;
    }

    // 3. Fetch this user's lesson_progress across these courses
    const { data: progressData, error: progressErr } = await supabase
      .from('lesson_progress')
      .select('lesson_id, course_id, is_completed, last_accessed_at')
      .eq('user_id', userId)
      .in('course_id', cleanCourseIds);

    if (progressErr) {
      console.error('Error fetching lesson_progress:', progressErr);
      throw progressErr;
    }

    const sections = (sectionsData || []) as ProgressSection[];
    const lessons = (lessonsData || []).map((l) => ({ ...l, title: '' })) as ProgressLesson[];
    const progressRows = (progressData || []) as ProgressRow[];

    const summaries = computeCourseProgressSummaries(cleanCourseIds, lessons, sections, progressRows);

    const result: Record<string, CourseProgress> = {};
    cleanCourseIds.forEach((courseId) => {
      const summary = summaries[courseId];
      result[courseId] = {
        courseId,
        totalLessons: summary.totalLessons,
        completedLessons: summary.completedLessons,
        percentage: summary.percentage,
      };
    });

    return result;
  } catch (err) {
    console.error('Unexpected error in fetchCoursesProgress:', err);
    throw err;
  }
}

/**
 * Resolves what the dashboard "Continue learning" section should show for a user:
 * the in-progress course to resume (with the exact lesson), a never-started
 * enrollment to nudge, an all-completed state, or no enrollments at all.
 */
export async function fetchContinueLearningTarget(userId: string): Promise<ContinueLearningTarget> {
  if (!userId) return { status: 'no_enrollments' };

  const { data: enrollmentsData, error: enrollmentsErr } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (enrollmentsErr) {
    console.error('Error fetching enrollments for continue learning:', enrollmentsErr);
    throw enrollmentsErr;
  }

  const enrollments = (enrollmentsData || [])
    .filter((e) => Boolean(e.course_id))
    .map((e) => ({ courseId: e.course_id as string, enrolledAt: e.enrolled_at as string }));

  if (enrollments.length === 0) return { status: 'no_enrollments' };

  const courseIds = enrollments.map((e) => e.courseId);

  const [coursesRes, sectionsRes, lessonsRes, progressRes] = await Promise.all([
    supabase.from('courses').select('id, title').in('id', courseIds),
    supabase
      .from('course_sections')
      .select('id, course_id, order_index, is_published, deleted_at')
      .in('course_id', courseIds)
      .eq('is_published', true)
      .is('deleted_at', null),
    supabase
      .from('lessons')
      .select('id, course_id, section_id, order_index, is_published, deleted_at, title')
      .in('course_id', courseIds)
      .eq('is_published', true)
      .is('deleted_at', null),
    supabase
      .from('lesson_progress')
      .select('lesson_id, course_id, is_completed, last_accessed_at')
      .eq('user_id', userId)
      .in('course_id', courseIds),
  ]);

  if (coursesRes.error) {
    console.error('Error fetching courses for continue learning:', coursesRes.error);
    throw coursesRes.error;
  }
  if (sectionsRes.error) {
    console.error('Error fetching course_sections for continue learning:', sectionsRes.error);
    throw sectionsRes.error;
  }
  if (lessonsRes.error) {
    console.error('Error fetching lessons for continue learning:', lessonsRes.error);
    throw lessonsRes.error;
  }
  if (progressRes.error) {
    console.error('Error fetching lesson_progress for continue learning:', progressRes.error);
    throw progressRes.error;
  }

  const courses = (coursesRes.data || []) as { id: string; title: string }[];
  const sections = (sectionsRes.data || []) as ProgressSection[];
  const lessons = (lessonsRes.data || []) as ProgressLesson[];
  const progressRows = (progressRes.data || []) as ProgressRow[];

  return resolveContinueLearningTarget(enrollments, courses, lessons, sections, progressRows);
}

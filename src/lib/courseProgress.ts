import { supabase } from './supabase';

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

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
    // 1. Fetch published sections for these courses
    const { data: sectionsData, error: sectionsErr } = await supabase
      .from('course_sections')
      .select('id, course_id, is_published')
      .in('course_id', cleanCourseIds)
      .eq('is_published', true);

    if (sectionsErr) {
      console.error('Error fetching course_sections for progress:', sectionsErr);
    }

    const publishedSections = sectionsData || [];
    const publishedSectionIdsByCourse: Record<string, Set<string>> = {};

    publishedSections.forEach((sec) => {
      if (!publishedSectionIdsByCourse[sec.course_id]) {
        publishedSectionIdsByCourse[sec.course_id] = new Set();
      }
      publishedSectionIdsByCourse[sec.course_id].add(sec.id);
    });

    // 2. Fetch published lessons for these courses
    const { data: lessonsData, error: lessonsErr } = await supabase
      .from('lessons')
      .select('id, course_id, section_id, is_published')
      .in('course_id', cleanCourseIds)
      .eq('is_published', true);

    if (lessonsErr) {
      console.error('Error fetching lessons for progress:', lessonsErr);
    }

    const allLessons = lessonsData || [];

    // Filter valid lessons per course (is_published AND inside a published section or section_id is null)
    const validLessonsByCourse: Record<string, string[]> = {};
    cleanCourseIds.forEach((id) => {
      validLessonsByCourse[id] = [];
    });

    allLessons.forEach((lesson) => {
      const cId = lesson.course_id;
      if (!cId || !validLessonsByCourse[cId]) return;

      if (!lesson.section_id) {
        validLessonsByCourse[cId].push(lesson.id);
      } else {
        const publishedSet = publishedSectionIdsByCourse[cId];
        if (publishedSet && publishedSet.has(lesson.section_id)) {
          validLessonsByCourse[cId].push(lesson.id);
        }
      }
    });

    // 3. Fetch completed lesson_progress for this user across these courses
    const { data: progressData, error: progressErr } = await supabase
      .from('lesson_progress')
      .select('lesson_id, course_id, is_completed')
      .eq('user_id', userId)
      .in('course_id', cleanCourseIds)
      .eq('is_completed', true);

    if (progressErr) {
      console.error('Error fetching lesson_progress:', progressErr);
    }

    const completedLessonSetByCourse: Record<string, Set<string>> = {};
    cleanCourseIds.forEach((id) => {
      completedLessonSetByCourse[id] = new Set();
    });

    (progressData || []).forEach((row) => {
      const cId = row.course_id;
      if (cId && completedLessonSetByCourse[cId] && row.lesson_id) {
        completedLessonSetByCourse[cId].add(row.lesson_id);
      }
    });

    // 4. Build progress map
    const result: Record<string, CourseProgress> = {};

    cleanCourseIds.forEach((courseId) => {
      const validLessonIds = validLessonsByCourse[courseId] || [];
      const totalLessons = validLessonIds.length;

      const completedSet = completedLessonSetByCourse[courseId] || new Set();
      let completedLessons = 0;
      validLessonIds.forEach((lId) => {
        if (completedSet.has(lId)) {
          completedLessons++;
        }
      });

      let rawPercentage = 0;
      if (totalLessons > 0) {
        rawPercentage = Math.round((completedLessons / totalLessons) * 100);
      }
      const percentage = Math.min(100, Math.max(0, rawPercentage));

      result[courseId] = {
        courseId,
        totalLessons,
        completedLessons,
        percentage,
      };
    });

    return result;
  } catch (err) {
    console.error('Unexpected error in fetchCoursesProgress:', err);
    return {};
  }
}

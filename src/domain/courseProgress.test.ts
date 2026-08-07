import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeCourseProgressSummaries,
  resolveContinueLearningTarget,
  resolveResumeLesson,
  selectValidLessons,
  type ProgressLesson,
  type ProgressRow,
  type ProgressSection,
} from './courseProgress';

const section = (overrides: Partial<ProgressSection> = {}): ProgressSection => ({
  id: 'section-1',
  course_id: 'course-1',
  order_index: 0,
  is_published: true,
  deleted_at: null,
  ...overrides,
});

const lesson = (overrides: Partial<ProgressLesson> = {}): ProgressLesson => ({
  id: 'lesson-1',
  course_id: 'course-1',
  section_id: 'section-1',
  order_index: 0,
  is_published: true,
  deleted_at: null,
  title: 'Lesson 1',
  ...overrides,
});

const progress = (overrides: Partial<ProgressRow> = {}): ProgressRow => ({
  course_id: 'course-1',
  lesson_id: 'lesson-1',
  is_completed: false,
  last_accessed_at: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

test('selectValidLessons excludes unpublished, soft-deleted, and unpublished-section lessons', () => {
  const sections = [section({ id: 'sec-published' }), section({ id: 'sec-unpublished', is_published: false }), section({ id: 'sec-deleted', deleted_at: '2026-08-01T00:00:00.000Z' })];
  const lessons = [
    lesson({ id: 'l-valid', section_id: 'sec-published' }),
    lesson({ id: 'l-unpublished-lesson', section_id: 'sec-published', is_published: false }),
    lesson({ id: 'l-deleted-lesson', section_id: 'sec-published', deleted_at: '2026-08-01T00:00:00.000Z' }),
    lesson({ id: 'l-unpublished-section', section_id: 'sec-unpublished' }),
    lesson({ id: 'l-deleted-section', section_id: 'sec-deleted' }),
  ];

  const result = selectValidLessons(lessons, sections);
  assert.deepEqual(result.map((l) => l.id), ['l-valid']);
});

test('computeCourseProgressSummaries ignores deleted/unpublished lessons entirely, including in the denominator', () => {
  const sections = [section()];
  const lessons = [
    lesson({ id: 'l1' }),
    lesson({ id: 'l2' }),
    lesson({ id: 'l3-deleted', deleted_at: '2026-08-01T00:00:00.000Z' }),
  ];
  const progressRows = [
    progress({ lesson_id: 'l1', is_completed: true }),
    progress({ lesson_id: 'l3-deleted', is_completed: true }),
  ];

  const summaries = computeCourseProgressSummaries(['course-1'], lessons, sections, progressRows);
  const summary = summaries['course-1'];

  assert.equal(summary.totalLessons, 2, 'deleted lesson must not count toward the total');
  assert.equal(summary.completedLessons, 1, 'progress against a deleted lesson must not count as completed');
  assert.equal(summary.percentage, 50);
  assert.equal(summary.hasStarted, true);
});

test('computeCourseProgressSummaries reports hasStarted=false and 0% when no valid progress rows exist', () => {
  const sections = [section()];
  const lessons = [lesson({ id: 'l1' }), lesson({ id: 'l2' })];

  const summaries = computeCourseProgressSummaries(['course-1'], lessons, sections, []);
  const summary = summaries['course-1'];

  assert.equal(summary.hasStarted, false);
  assert.equal(summary.percentage, 0);
  assert.equal(summary.lastAccessedAt, null);
});

test('computeCourseProgressSummaries never divides by zero for a course with no valid lessons', () => {
  const summaries = computeCourseProgressSummaries(['course-1'], [], [], []);
  assert.equal(summaries['course-1'].totalLessons, 0);
  assert.equal(summaries['course-1'].percentage, 0);
});

test('resolveResumeLesson prefers the most recently accessed incomplete lesson', () => {
  const lessons = [lesson({ id: 'l1', order_index: 0 }), lesson({ id: 'l2', order_index: 1 }), lesson({ id: 'l3', order_index: 2 })];
  const progressRows = [
    progress({ lesson_id: 'l1', is_completed: true, last_accessed_at: '2026-08-01T00:00:00.000Z' }),
    progress({ lesson_id: 'l2', is_completed: false, last_accessed_at: '2026-08-03T00:00:00.000Z' }),
    progress({ lesson_id: 'l3', is_completed: false, last_accessed_at: '2026-08-02T00:00:00.000Z' }),
  ];

  const result = resolveResumeLesson(lessons, progressRows);
  assert.equal(result?.lessonId, 'l2');
});

test('resolveResumeLesson falls back to the first incomplete lesson in course order when nothing was ever accessed', () => {
  const lessons = [lesson({ id: 'l1', order_index: 0 }), lesson({ id: 'l2', order_index: 1 })];
  const result = resolveResumeLesson(lessons, []);
  assert.equal(result?.lessonId, 'l1');
});

test('resolveResumeLesson falls back to the last lesson when the course is fully complete', () => {
  const lessons = [lesson({ id: 'l1', order_index: 0 }), lesson({ id: 'l2', order_index: 1 })];
  const progressRows = [
    progress({ lesson_id: 'l1', is_completed: true }),
    progress({ lesson_id: 'l2', is_completed: true }),
  ];
  const result = resolveResumeLesson(lessons, progressRows);
  assert.equal(result?.lessonId, 'l2');
});

test('resolveResumeLesson returns null for a course with no valid lessons', () => {
  assert.equal(resolveResumeLesson([], []), null);
});

test('resolveContinueLearningTarget returns no_enrollments with zero enrollments', () => {
  const result = resolveContinueLearningTarget([], [], [], [], []);
  assert.deepEqual(result, { status: 'no_enrollments' });
});

test('resolveContinueLearningTarget picks the most recently accessed in-progress course over other enrollments', () => {
  const enrollments = [
    { courseId: 'course-a', enrolledAt: '2026-07-01T00:00:00.000Z' },
    { courseId: 'course-b', enrolledAt: '2026-07-15T00:00:00.000Z' },
  ];
  const courses = [{ id: 'course-a', title: 'Course A' }, { id: 'course-b', title: 'Course B' }];
  const sections = [section({ id: 'sec-a', course_id: 'course-a' }), section({ id: 'sec-b', course_id: 'course-b' })];
  const lessons = [
    lesson({ id: 'a1', course_id: 'course-a', section_id: 'sec-a', title: 'A Lesson 1' }),
    lesson({ id: 'a2', course_id: 'course-a', section_id: 'sec-a', order_index: 1, title: 'A Lesson 2' }),
    lesson({ id: 'b1', course_id: 'course-b', section_id: 'sec-b', title: 'B Lesson 1' }),
  ];
  const progressRows = [
    progress({ course_id: 'course-a', lesson_id: 'a1', is_completed: true, last_accessed_at: '2026-08-01T00:00:00.000Z' }),
    progress({ course_id: 'course-b', lesson_id: 'b1', is_completed: false, last_accessed_at: '2026-08-05T00:00:00.000Z' }),
  ];

  const result = resolveContinueLearningTarget(enrollments, courses, lessons, sections, progressRows);
  assert.equal(result.status, 'in_progress');
  if (result.status === 'in_progress') {
    assert.equal(result.course.id, 'course-b');
    assert.equal(result.lessonId, 'b1');
    assert.equal(result.lessonTitle, 'B Lesson 1');
  }
});

test('resolveContinueLearningTarget falls back to the most recently enrolled never-started course', () => {
  const enrollments = [
    { courseId: 'course-a', enrolledAt: '2026-07-01T00:00:00.000Z' },
    { courseId: 'course-b', enrolledAt: '2026-07-15T00:00:00.000Z' },
  ];
  const courses = [{ id: 'course-a', title: 'Course A' }, { id: 'course-b', title: 'Course B' }];
  const sections = [section({ id: 'sec-a', course_id: 'course-a' }), section({ id: 'sec-b', course_id: 'course-b' })];
  const lessons = [
    lesson({ id: 'a1', course_id: 'course-a', section_id: 'sec-a', title: 'A Lesson 1' }),
    lesson({ id: 'b1', course_id: 'course-b', section_id: 'sec-b', title: 'B Lesson 1' }),
  ];

  const result = resolveContinueLearningTarget(enrollments, courses, lessons, sections, []);
  assert.equal(result.status, 'not_started');
  if (result.status === 'not_started') {
    assert.equal(result.course.id, 'course-b');
    assert.equal(result.lessonId, 'b1');
  }
});

test('resolveContinueLearningTarget reports all_completed when every enrolled course is at 100%', () => {
  const enrollments = [{ courseId: 'course-a', enrolledAt: '2026-07-01T00:00:00.000Z' }];
  const courses = [{ id: 'course-a', title: 'Course A' }];
  const sections = [section({ id: 'sec-a', course_id: 'course-a' })];
  const lessons = [lesson({ id: 'a1', course_id: 'course-a', section_id: 'sec-a' })];
  const progressRows = [progress({ course_id: 'course-a', lesson_id: 'a1', is_completed: true })];

  const result = resolveContinueLearningTarget(enrollments, courses, lessons, sections, progressRows);
  assert.equal(result.status, 'all_completed');
  if (result.status === 'all_completed') {
    assert.equal(result.course.id, 'course-a');
    assert.equal(result.completedLessons, 1);
    assert.equal(result.totalLessons, 1);
  }
});

test('resolveContinueLearningTarget treats an enrolled course with zero valid lessons as not_started, not all_completed', () => {
  const enrollments = [{ courseId: 'course-a', enrolledAt: '2026-07-01T00:00:00.000Z' }];
  const courses = [{ id: 'course-a', title: 'Course A' }];

  const result = resolveContinueLearningTarget(enrollments, courses, [], [], []);
  assert.equal(result.status, 'not_started');
  if (result.status === 'not_started') {
    assert.equal(result.lessonId, null);
    assert.equal(result.totalLessons, 0);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { ContinueLearningTarget } from '../lib/courseProgress';
import { ContinueLearningCard } from '../components/dashboard/ContinueLearningCard';
import { renderFrontend } from './renderFrontend';

test('in_progress state shows the exact resume lesson, a direct link, and the completion count', () => {
  const target: ContinueLearningTarget = {
    status: 'in_progress',
    course: { id: '4bfb3a53-b68d-4c44-b366-cea65deae507', title: 'Skin and Hair Cair Diploma Part 2' },
    lessonId: '194d2ecf-5d99-480b-ba1d-7c15546e02d6',
    lessonTitle: 'Cosmeceutical Diploma Part 2, PDF 2',
    completedLessons: 0,
    totalLessons: 4,
    percentage: 0,
  };

  const markup = renderFrontend(<ContinueLearningCard target={target} />);

  assert.match(markup, /In Progress/);
  assert.match(markup, /Skin and Hair Cair Diploma Part 2/);
  assert.match(markup, /Cosmeceutical Diploma Part 2, PDF 2/);
  assert.match(markup, /0 of 4 lessons/);
  assert.match(markup, />0%</);
  assert.match(markup, /Continue Learning/);
  assert.doesNotMatch(markup, /disabled/);
});

test('not_started state offers to start the course at its first lesson instead of "Continue Learning"', () => {
  const target: ContinueLearningTarget = {
    status: 'not_started',
    course: { id: 'e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0', title: 'Skin and Hair Cair Diploma Part 1' },
    lessonId: 'eb6ab00d-0000-0000-0000-000000000000',
    lessonTitle: 'Lecture 1: Introduction',
    totalLessons: 6,
  };

  const markup = renderFrontend(<ContinueLearningCard target={target} />);

  assert.match(markup, /Ready to start/);
  assert.match(markup, /Skin and Hair Cair Diploma Part 1/);
  assert.match(markup, /First lesson:.*Lecture 1: Introduction/s);
  assert.match(markup, /Start course/);
  assert.doesNotMatch(markup, /Continue Learning|In Progress/);
});

test('not_started with a course that has zero valid lessons disables its CTA instead of linking nowhere', () => {
  const target: ContinueLearningTarget = {
    status: 'not_started',
    course: { id: 'course-empty', title: 'Empty course' },
    lessonId: null,
    lessonTitle: null,
    totalLessons: 0,
  };

  const markup = renderFrontend(<ContinueLearningCard target={target} />);
  assert.match(markup, /no published lessons yet/);
  assert.match(markup, /disabled=""/);
});

test('all_completed state congratulates the student and offers review + explore actions, no percentage bar', () => {
  const target: ContinueLearningTarget = {
    status: 'all_completed',
    course: { id: 'course-done', title: 'Finished Course' },
    completedLessons: 5,
    totalLessons: 5,
  };

  const markup = renderFrontend(<ContinueLearningCard target={target} />);

  assert.match(markup, /All caught up/);
  assert.match(markup, /Finished Course/);
  assert.match(markup, /5 of 5 lessons complete/);
  assert.match(markup, /Review course/);
  assert.match(markup, /Explore more courses/);
});

test('no_enrollments state renders nothing (the dashboard\'s own empty state owns this case)', () => {
  const markup = renderFrontend(<ContinueLearningCard target={{ status: 'no_enrollments' }} />);
  assert.equal(markup, '');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionReviewStatus,
  defaultCompletionRule,
  isLessonContentType,
  legacyLessonTypeToCanonical,
  LESSON_CONTENT_TYPES,
  isConsistentCourseWorkflowState,
} from './courseAuthoring';

test('exposes only the five production lesson content types', () => {
  assert.deepEqual(LESSON_CONTENT_TYPES, ['video', 'pdf', 'external_link', 'quiz', 'assignment']);
  assert.equal(isLessonContentType('audio'), false);
  assert.equal(isLessonContentType('quiz'), true);
});

test('rejects impossible authoring, review, and publication combinations', () => {
  assert.equal(isConsistentCourseWorkflowState({ authoringStatus: 'in_review', reviewStatus: 'submitted', publicationStatus: 'draft' }), true);
  assert.equal(isConsistentCourseWorkflowState({ authoringStatus: 'approved', reviewStatus: 'approved', publicationStatus: 'published' }), true);
  assert.equal(isConsistentCourseWorkflowState({ authoringStatus: 'draft', reviewStatus: 'approved', publicationStatus: 'draft' }), false);
  assert.equal(isConsistentCourseWorkflowState({ authoringStatus: 'in_review', reviewStatus: 'submitted', publicationStatus: 'published' }), false);
});

test('selects a type-safe completion rule', () => {
  assert.equal(defaultCompletionRule('video'), 'watch90');
  assert.equal(defaultCompletionRule('pdf'), 'open_resource');
  assert.equal(defaultCompletionRule('external_link'), 'open_resource');
  assert.equal(defaultCompletionRule('quiz'), 'pass_quiz');
  assert.equal(defaultCompletionRule('assignment'), 'upload_assignment');
});

test('allows only explicit course review transitions', () => {
  assert.equal(canTransitionReviewStatus('not_submitted', 'submitted'), true);
  assert.equal(canTransitionReviewStatus('submitted', 'approved'), true);
  assert.equal(canTransitionReviewStatus('approved', 'submitted'), false);
  assert.equal(canTransitionReviewStatus('changes_requested', 'approved'), false);
});

test('does not silently coerce unsupported legacy lesson types', () => {
  assert.equal(legacyLessonTypeToCanonical('link'), 'external_link');
  assert.equal(legacyLessonTypeToCanonical('article'), null);
  assert.equal(legacyLessonTypeToCanonical('audio'), null);
});

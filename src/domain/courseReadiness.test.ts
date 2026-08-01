import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCourseForm } from '../lib/adminCourseForm';
import { COURSE_DESCRIPTION_MIN_LENGTH, COURSE_SUMMARY_MIN_LENGTH, readinessTargetHref } from './courseReadiness';

test('authoring validation enforces the same summary and description thresholds as review', () => {
  const invalid = validateCourseForm({ title: 'Course', slug: 'course', shortDescription: 'Too short', description: 'Also too short', priceEgp: '0', priceUsd: '0' });
  assert.match(invalid.shortDescription, new RegExp(String(COURSE_SUMMARY_MIN_LENGTH)));
  assert.match(invalid.description, new RegExp(String(COURSE_DESCRIPTION_MIN_LENGTH)));

  const valid = validateCourseForm({
    title: 'Course', slug: 'course',
    shortDescription: 'S'.repeat(COURSE_SUMMARY_MIN_LENGTH),
    description: 'D'.repeat(COURSE_DESCRIPTION_MIN_LENGTH),
    priceEgp: '0', priceUsd: '0',
  });
  assert.deepEqual(valid, {});
});

test('readiness targets deep-link to the correct authoring surface', () => {
  assert.equal(readinessTargetHref('course-id', 'details'), '/admin/courses/course-id/edit');
  assert.equal(readinessTargetHref('course-id', 'pricing'), '/admin/courses/course-id/builder?tab=pricing');
  assert.equal(readinessTargetHref('course-id', 'curriculum'), '/admin/courses/course-id/builder?tab=curriculum');
});

test('authoring validation rejects blank dynamic-list items', () => {
  const errors = validateCourseForm({
    title: 'Course', slug: 'course',
    shortDescription: 'S'.repeat(COURSE_SUMMARY_MIN_LENGTH),
    description: 'D'.repeat(COURSE_DESCRIPTION_MIN_LENGTH),
    priceEgp: '0', priceUsd: '0',
    learningOutcomes: ['Useful outcome', '  '], requirements: [''], targetAudience: ['Professionals'],
  });
  assert.ok(errors.learningOutcomes);
  assert.ok(errors.requirements);
  assert.equal(errors.targetAudience, undefined);
});

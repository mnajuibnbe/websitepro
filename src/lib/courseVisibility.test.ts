import assert from 'node:assert/strict';
import test from 'node:test';
import { isActiveEnrollment, isHomeCourse } from './courseVisibility.js';

test('Home includes only published featured courses', () => {
  assert.equal(isHomeCourse({ status: 'published', is_featured: true }), true);
  assert.equal(isHomeCourse({ status: 'published', is_featured: false }), false);
  assert.equal(isHomeCourse({ status: 'draft', is_featured: true }), false);
});

test('student course access treats only active enrollment as approved', () => {
  assert.equal(isActiveEnrollment({ status: 'active' }), true);
  assert.equal(isActiveEnrollment({ status: 'pending' }), false);
  assert.equal(isActiveEnrollment({ status: 'cancelled' }), false);
  assert.equal(isActiveEnrollment({ status: 'rejected' }), false);
});

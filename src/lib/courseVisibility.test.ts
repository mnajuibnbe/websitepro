import assert from 'node:assert/strict';
import test from 'node:test';
import { isActiveEnrollment, isHomeCourse } from './courseVisibility.js';

test('Home includes published courses and excludes drafts', () => {
  assert.equal(isHomeCourse({ status: 'published' }), true);
  assert.equal(isHomeCourse({ status: 'draft' }), false);
  assert.equal(isHomeCourse({ status: 'archived' }), false);
});

test('student course access treats only active enrollment as approved', () => {
  assert.equal(isActiveEnrollment({ status: 'active' }), true);
  assert.equal(isActiveEnrollment({ status: 'pending' }), false);
  assert.equal(isActiveEnrollment({ status: 'cancelled' }), false);
  assert.equal(isActiveEnrollment({ status: 'rejected' }), false);
});

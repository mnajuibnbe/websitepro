import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE_LANGUAGES } from './courseTaxonomy';

test('course language choices are controlled', () => {
  assert.deepEqual(COURSE_LANGUAGES, ['Arabic', 'English']);
});

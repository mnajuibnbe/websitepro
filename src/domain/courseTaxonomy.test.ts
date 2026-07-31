import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE_CATEGORIES, COURSE_LANGUAGES } from './courseTaxonomy';

test('course taxonomy uses unique stable category values', () => {
  const values = COURSE_CATEGORIES.map(category => category.value);
  assert.equal(new Set(values).size, values.length);
  assert.ok(COURSE_CATEGORIES.every(category => category.description.length > 20));
});

test('course language choices are controlled', () => {
  assert.deepEqual(COURSE_LANGUAGES, ['English']);
});

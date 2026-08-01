import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE_CATEGORIES, COURSE_LANGUAGES } from './courseTaxonomy';
import { getCourseSalesTheme } from './courseSalesTheme';

test('course taxonomy uses unique stable category values', () => {
  const values = COURSE_CATEGORIES.map(category => category.value);
  assert.equal(new Set(values).size, values.length);
  assert.ok(COURSE_CATEGORIES.every(category => category.description.length > 20));
});

test('course language choices are controlled', () => {
  assert.deepEqual(COURSE_LANGUAGES, ['English']);
});

test('sales-page themes visibly distinguish skin and hair courses', () => {
  const skin = getCourseSalesTheme('Skin Care');
  const hair = getCourseSalesTheme('Hair Care');
  assert.notEqual(skin.badge, hair.badge);
  assert.notEqual(skin.panel, hair.panel);
  assert.notEqual(skin.icon, hair.icon);
});

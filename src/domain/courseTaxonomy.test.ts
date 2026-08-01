import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE_LANGUAGES } from './courseTaxonomy';
import { getCourseSalesTheme } from './courseSalesTheme';

test('course language choices are controlled', () => {
  assert.deepEqual(COURSE_LANGUAGES, ['English']);
});

test('sales-page themes visibly distinguish skin and hair courses', () => {
  const skin = getCourseSalesTheme('Skin care');
  const hair = getCourseSalesTheme('Hair care');
  assert.notEqual(skin.badge, hair.badge);
  assert.notEqual(skin.panel, hair.panel);
  assert.notEqual(skin.icon, hair.icon);
});

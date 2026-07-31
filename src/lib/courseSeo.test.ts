import assert from 'node:assert/strict';
import test from 'node:test';
import { generateCourseSeo } from './courseSeo';

test('generates bounded course metadata from clean course content', () => {
  const seo = generateCourseSeo({ title: 'Advanced Skin Science', shortDescription: '<p>Evidence-based learning for working professionals.</p>' });
  assert.equal(seo.title, 'Advanced Skin Science | Tutiba');
  assert.equal(seo.description, 'Evidence-based learning for working professionals.');
  assert.ok(seo.title.length <= 60);
  assert.ok(seo.description.length <= 160);
});

test('generates a useful fallback description', () => {
  assert.match(generateCourseSeo({ title: 'Cosmeceuticals', category: 'Skin Care' }).description, /Skin Care/);
});

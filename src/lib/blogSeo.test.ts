import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveCanonicalUrl, deriveMetaDescription, deriveSeoTitle, genericTitleHint, metaDescriptionHint, seoTitleHint, textLikelyMentionsQuery } from './blogSeo';

test('derives a default SEO title from the post title', () => {
  assert.equal(deriveSeoTitle('Reading Skincare Research'), 'Reading Skincare Research | Tutiba Blog');
  assert.equal(deriveSeoTitle(''), 'Tutiba Blog');
});

test('derives a meta description from the excerpt, falling back to article text', () => {
  assert.equal(deriveMetaDescription('  A useful excerpt.  '), 'A useful excerpt.');
  assert.equal(deriveMetaDescription(null, '<p>Opening sentence of the article.</p>'), 'Opening sentence of the article.');
});

test('derives the canonical URL from site origin and slug', () => {
  assert.equal(deriveCanonicalUrl('https://tutiba.com/', 'my-post'), 'https://tutiba.com/blog/my-post');
});

test('title/description hints are informational only, never required', () => {
  assert.equal(seoTitleHint('Short title'), null);
  assert.match(seoTitleHint('A'.repeat(61)) || '', /may truncate/);
  assert.match(metaDescriptionHint(''), /generate one/);
  assert.match(metaDescriptionHint('A'.repeat(161)) || '', /may truncate/);
});

test('textLikelyMentionsQuery is null with no query, exact-match or loose-match otherwise', () => {
  assert.equal(textLikelyMentionsQuery('Anything', null), null);
  assert.equal(textLikelyMentionsQuery('A guide to retinol for sensitive skin', 'retinol for sensitive skin'), true);
  assert.equal(textLikelyMentionsQuery('Completely unrelated gardening content', 'sourdough bread baking tips'), false);
});

test('genericTitleHint nudges on placeholder or very short titles, ignores real ones', () => {
  assert.match(genericTitleHint('Untitled') || '', /generic/);
  assert.match(genericTitleHint('Skincare') || '', /short/);
  assert.equal(genericTitleHint('How Retinol Affects Sensitive Skin'), null);
});

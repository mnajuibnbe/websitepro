import assert from 'node:assert/strict';
import test from 'node:test';
import { computeContentSeoScore } from './blogSeoScore';

const baseInput = {
  title: 'How Retinol Affects Sensitive Skin',
  effectiveSeoTitle: 'How Retinol Affects Sensitive Skin | Tutiba Blog',
  effectiveMetaDescription: 'A practical guide to using retinol safely on sensitive skin.',
  contentHtml: '<p>Retinol for sensitive skin needs a careful routine.</p><h2>Getting started</h2><p>Start slowly and patch test first.</p>',
  primaryQuery: 'retinol for sensitive skin',
  searchIntent: 'informational',
  coverImageUrl: 'https://example.com/cover.jpg',
};

test('stub categories (Phase 3) are excluded from the weighted average, not scored as 0', () => {
  const score = computeContentSeoScore(baseInput);
  const stubs = score.categories.filter((c) => c.status === 'stub');
  assert.deepEqual(stubs.map((c) => c.key).sort(), ['internal_links', 'topic_coverage', 'trust_sources']);
  assert.ok(stubs.every((c) => c.scorePercent === null && c.weight === 0));
});

test('a well-formed post with a matching target query scores highly', () => {
  const score = computeContentSeoScore(baseInput);
  assert.ok(score.overallPercent >= 80, `expected a high score, got ${score.overallPercent}`);
});

test('overall score is a weighted average bounded between 0 and 100', () => {
  const score = computeContentSeoScore({ ...baseInput, primaryQuery: null, searchIntent: null, coverImageUrl: null, contentHtml: '' });
  assert.ok(score.overallPercent >= 0 && score.overallPercent <= 100);
});

test('missing search intent scores that category at 0 without crashing the average', () => {
  const score = computeContentSeoScore({ ...baseInput, searchIntent: null });
  const intent = score.categories.find((c) => c.key === 'search_intent')!;
  assert.equal(intent.scorePercent, 0);
  assert.ok(score.overallPercent > 0);
});

test('on-page SEO checks that need a query are excluded (not failed) when no query is set', () => {
  const score = computeContentSeoScore({ ...baseInput, primaryQuery: null });
  const onPage = score.categories.find((c) => c.key === 'on_page_seo')!;
  // Only the two always-applicable checks remain: "query set" (fails) and "title not generic" (passes) => 50%.
  assert.equal(onPage.scorePercent, 50);
});

test('missing alt text on images lowers Technical Readiness', () => {
  const withAlt = computeContentSeoScore({ ...baseInput, contentHtml: `${baseInput.contentHtml}<img src="https://example.com/a.png" alt="Diagram">` });
  const withoutAlt = computeContentSeoScore({ ...baseInput, contentHtml: `${baseInput.contentHtml}<img src="https://example.com/a.png">` });
  const techWith = withAlt.categories.find((c) => c.key === 'technical_readiness')!.scorePercent!;
  const techWithout = withoutAlt.categories.find((c) => c.key === 'technical_readiness')!.scorePercent!;
  assert.ok(techWithout < techWith);
});

test('never crashes on empty content', () => {
  assert.doesNotThrow(() => computeContentSeoScore({ ...baseInput, contentHtml: '', primaryQuery: null }));
});

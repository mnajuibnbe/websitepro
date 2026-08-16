import assert from 'node:assert/strict';
import test from 'node:test';
import { computeContentSeoScore } from './blogSeoScore';
import type { OriginalValueSignal } from '../services/blogPosts.service';

const baseInput = {
  title: 'How Retinol Affects Sensitive Skin',
  effectiveSeoTitle: 'How Retinol Affects Sensitive Skin | Tutiba Blog',
  effectiveMetaDescription: 'A practical guide to using retinol safely on sensitive skin.',
  contentHtml: '<p>Retinol for sensitive skin needs a careful routine.</p><h2>Getting started</h2><p>Start slowly and patch test first.</p><p>See <a href="/blog/skincare-basics">this guide</a> and <a href="/course/abc">this course</a>.</p>',
  primaryQuery: 'retinol for sensitive skin',
  searchIntent: 'informational',
  coverImageUrl: 'https://example.com/cover.jpg',
  originalValueSignals: ['personal_experience', 'testing_results', 'data'] as OriginalValueSignal[],
  sources: [
    { name: 'Dermatology Study', url: 'https://example.com/study', accessedDate: '2026-08-16' },
    { name: 'Clinical Trial Data', url: 'https://example.com/trial', accessedDate: '2026-08-16' },
  ],
};

test('topic coverage is the only remaining stub, excluded from the weighted average, not scored as 0', () => {
  const score = computeContentSeoScore(baseInput);
  const stubs = score.categories.filter((c) => c.status === 'stub');
  assert.deepEqual(stubs.map((c) => c.key), ['topic_coverage']);
  assert.ok(stubs.every((c) => c.scorePercent === null && c.weight === 0));
});

test('internal links and trust & sources are now scored (Phase 3)', () => {
  const score = computeContentSeoScore(baseInput);
  const internalLinks = score.categories.find((c) => c.key === 'internal_links')!;
  const trustSources = score.categories.find((c) => c.key === 'trust_sources')!;
  assert.equal(internalLinks.status, 'scored');
  assert.equal(internalLinks.scorePercent, 100);
  assert.equal(trustSources.status, 'scored');
  assert.equal(trustSources.scorePercent, 100);
});

test('no internal links or trust signals scores those categories at 0, not null', () => {
  const score = computeContentSeoScore({ ...baseInput, contentHtml: '<p>No links here.</p>', originalValueSignals: [], sources: [] });
  const internalLinks = score.categories.find((c) => c.key === 'internal_links')!;
  const trustSources = score.categories.find((c) => c.key === 'trust_sources')!;
  assert.equal(internalLinks.scorePercent, 0);
  assert.equal(trustSources.scorePercent, 0);
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

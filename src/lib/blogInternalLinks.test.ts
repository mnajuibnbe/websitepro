import assert from 'node:assert/strict';
import test from 'node:test';
import { countInternalLinks, extractLinkHrefs, suggestInternalLinks, type LinkCandidate } from './blogInternalLinks';

const candidates: LinkCandidate[] = [
  { kind: 'course', id: 'c1', href: '/course/c1', title: 'Skin and Hair Care Diploma', summary: 'A full diploma on skincare fundamentals', category: 'Skincare' },
  { kind: 'course', id: 'c2', href: '/course/c2', title: 'Advanced Makeup Artistry', summary: 'Professional makeup techniques', category: 'Makeup' },
  { kind: 'post', id: 'p1', href: '/blog/retinol-guide', title: 'A Complete Retinol Guide', summary: 'How retinol works for sensitive skin', category: 'Skincare' },
];

test('extractLinkHrefs pulls every href in document order', () => {
  const html = '<p>See <a href="/course/c1">this</a> and <a href="https://example.com">that</a>.</p>';
  assert.deepEqual(extractLinkHrefs(html), ['/course/c1', 'https://example.com']);
});

test('countInternalLinks only counts site-relative links and dedupes', () => {
  const html = '<p><a href="/course/c1">A</a> <a href="/course/c1">A again</a> <a href="https://example.com">B</a></p>';
  const counts = countInternalLinks(html);
  assert.equal(counts.total, 2);
  assert.deepEqual(counts.uniqueHrefs, ['/course/c1']);
});

test('suggestInternalLinks ranks topically related candidates above unrelated ones', () => {
  const article = { title: 'Retinol for Sensitive Skin', primaryQuery: 'retinol sensitive skin', secondaryQueries: [], contentHtml: '<p>Intro</p><h2>Skincare routine basics</h2>' };
  const suggestions = suggestInternalLinks(article, candidates);
  assert.ok(suggestions.length > 0);
  assert.equal(suggestions[0].id, 'p1');
  assert.ok(!suggestions.some((s) => s.id === 'c2'), 'unrelated makeup course should not surface');
});

test('already-linked candidates are flagged, not dropped', () => {
  const article = { title: 'Retinol for Sensitive Skin', primaryQuery: 'retinol sensitive skin', secondaryQueries: [], contentHtml: '<p>See <a href="/blog/retinol-guide">this</a></p>' };
  const suggestions = suggestInternalLinks(article, candidates);
  const linked = suggestions.find((s) => s.id === 'p1');
  assert.ok(linked);
  assert.equal(linked!.alreadyLinked, true);
});

test('zero-overlap candidates are excluded entirely', () => {
  const article = { title: 'Zzz Unrelated Topic Qqq', primaryQuery: null, secondaryQueries: [], contentHtml: '<p>Nothing in common here.</p>' };
  const suggestions = suggestInternalLinks(article, candidates);
  assert.equal(suggestions.length, 0);
});

test('respects the limit parameter', () => {
  const manyCandidates: LinkCandidate[] = Array.from({ length: 10 }, (_, i) => ({ kind: 'post', id: `p${i}`, href: `/blog/skincare-${i}`, title: 'Skincare Routine Guide', summary: 'skincare', category: 'Skincare' }));
  const article = { title: 'Skincare Routine Guide', primaryQuery: null, secondaryQueries: [], contentHtml: '' };
  const suggestions = suggestInternalLinks(article, manyCandidates, 3);
  assert.equal(suggestions.length, 3);
});

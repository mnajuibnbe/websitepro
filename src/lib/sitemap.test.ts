import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemapXml, type SitemapEntry } from './sitemap';
import { PUBLIC_PAGES } from '../config/publicPages';

// Mirrors scripts/generate-seo-files.mjs's DISALLOWED_PATHS — private/noindex
// route prefixes that must never leak into the sitemap.
const DISALLOWED_PATHS = [
  '/dashboard', '/profile', '/my-courses', '/learn', '/lesson', '/quiz',
  '/certificate', '/checkout', '/admin', '/instructor', '/unauthorized',
  '/login', '/register', '/forgot-password', '/update-password',
];

function staticEntries(pages: readonly { path: string; changefreq: string; priority: string }[]): SitemapEntry[] {
  return pages.map((page) => ({ path: page.path, changefreq: page.changefreq, priority: page.priority }));
}

test('buildSitemapXml renders one <url> per entry with loc, changefreq and priority', () => {
  const xml = buildSitemapXml('https://example.com', [
    { path: '/about', changefreq: 'monthly', priority: '0.5' },
  ]);
  assert.match(xml, /<loc>https:\/\/example\.com\/about<\/loc>/);
  assert.match(xml, /<changefreq>monthly<\/changefreq>/);
  assert.match(xml, /<priority>0\.5<\/priority>/);
});

test('buildSitemapXml includes a dated entry\'s lastmod, formatted as YYYY-MM-DD', () => {
  const xml = buildSitemapXml('https://example.com', [
    { path: '/course/abc', changefreq: 'weekly', priority: '0.8', updatedAt: '2026-03-05T12:34:56Z' },
  ]);
  assert.match(xml, /<lastmod>2026-03-05<\/lastmod>/);
});

test('buildSitemapXml XML-escapes special characters in the path', () => {
  const xml = buildSitemapXml('https://example.com', [{ path: '/a&b', changefreq: 'monthly', priority: '0.5' }]);
  assert.match(xml, /<loc>https:\/\/example\.com\/a&amp;b<\/loc>/);
});

// Regression test for the original bug: /refund-policy shipped in App.tsx's
// routing but was never added to the sitemap generator's hand-kept
// STATIC_PAGES array, so it silently never appeared in sitemap.xml. It is
// now registered in src/config/publicPages.ts, the single source both
// routing and the sitemap read from — assert it actually reaches the
// generated sitemap.
test('every page registered in src/config/publicPages.ts appears in the generated sitemap, including refund-policy', () => {
  const xml = buildSitemapXml('https://example.com', staticEntries(PUBLIC_PAGES));

  for (const page of PUBLIC_PAGES) {
    assert.match(xml, new RegExp(`<loc>https://example\\.com${page.path.replace(/\//g, '\\/')}</loc>`), `missing sitemap entry for ${page.path}`);
  }
  assert.match(xml, /<loc>https:\/\/example\.com\/refund-policy<\/loc>/);
});

// Proves the auto-discovery mechanism itself, not just today's fixed list:
// a page added to the single source (src/config/publicPages.ts) must appear
// in the sitemap output through the exact same code path
// scripts/generate-seo-files.mjs uses, without that script being touched.
test('a new page appended to the public-pages source automatically appears in the sitemap', () => {
  const withNewPage = [
    ...staticEntries(PUBLIC_PAGES),
    { path: '/careers', changefreq: 'monthly' as const, priority: '0.4' },
  ];

  const xml = buildSitemapXml('https://example.com', withNewPage);

  assert.match(xml, /<loc>https:\/\/example\.com\/careers<\/loc>/);
});

test('no publicly registered page is also a disallowed/private path prefix', () => {
  for (const page of PUBLIC_PAGES) {
    const leaksPrivatePath = DISALLOWED_PATHS.some((prefix) => page.path === prefix || page.path.startsWith(`${prefix}/`));
    assert.equal(leaksPrivatePath, false, `${page.path} overlaps a disallowed/private route prefix`);
  }
});

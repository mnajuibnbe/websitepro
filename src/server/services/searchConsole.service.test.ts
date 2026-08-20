import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPageUrl, fetchPagePerformance, type SearchConsoleDependencies } from './searchConsole.service.js';

function buildClient(rows: { totals: any[]; queries: any[] }) {
  const calls: any[] = [];
  const client = {
    searchanalytics: {
      query: async ({ requestBody }: any) => {
        calls.push(requestBody);
        const isQueryDimension = Array.isArray(requestBody.dimensions) && requestBody.dimensions.includes('query');
        return { data: { rows: isQueryDimension ? rows.queries : rows.totals } };
      },
    },
  };
  return { client, calls };
}

test('buildPageUrl derives the public URL for a blog post', () => {
  assert.equal(buildPageUrl('blog_post', 'retinol-guide'), 'https://tutiba.com/blog/retinol-guide');
});

test('buildPageUrl derives the public URL for a course (id-based, not slug)', () => {
  assert.equal(buildPageUrl('course', '123e4567-e89b-12d3-a456-426614174000'), 'https://tutiba.com/course/123e4567-e89b-12d3-a456-426614174000');
});

test('buildPageUrl lowercases a mixed-case course id so it still matches the site\'s real (lowercase) URL', () => {
  assert.equal(buildPageUrl('course', '123E4567-E89B-12D3-A456-426614174000'), 'https://tutiba.com/course/123e4567-e89b-12d3-a456-426614174000');
});

test('returns missing_credentials without throwing when the client cannot be built', async () => {
  const deps: SearchConsoleDependencies = { getSearchConsoleClient: () => { throw new Error('GOOGLE_SEARCH_CONSOLE_CREDENTIALS environment variable is not configured'); } };
  const result = await fetchPagePerformance(`https://tutiba.com/blog/no-creds-${Date.now()}`, deps);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'missing_credentials');
});

test('maps totals and top queries from two searchanalytics.query calls', async () => {
  const { client } = buildClient({
    totals: [{ clicks: 12, impressions: 340, ctr: 0.0353, position: 8.2 }],
    queries: [
      { keys: ['retinol guide'], clicks: 5, impressions: 100, ctr: 0.05, position: 6 },
      { keys: ['gentle retinol'], clicks: 3, impressions: 80, ctr: 0.0375, position: 9.1 },
    ],
  });
  const deps: SearchConsoleDependencies = { getSearchConsoleClient: () => client as any };
  const pageUrl = `https://tutiba.com/blog/mapped-${Date.now()}`;
  const result = await fetchPagePerformance(pageUrl, deps);

  assert.equal(result.ok, true);
  assert.equal(result.data?.clicks, 12);
  assert.equal(result.data?.impressions, 340);
  assert.equal(result.data?.topQueries.length, 2);
  assert.equal(result.data?.topQueries[0].query, 'retinol guide');
  assert.equal(result.data?.pageUrl, pageUrl);
});

test('returns zeroed data instead of throwing when there are no rows yet', async () => {
  const { client } = buildClient({ totals: [], queries: [] });
  const deps: SearchConsoleDependencies = { getSearchConsoleClient: () => client as any };
  const result = await fetchPagePerformance(`https://tutiba.com/blog/no-rows-${Date.now()}`, deps);
  assert.equal(result.ok, true);
  assert.equal(result.data?.clicks, 0);
  assert.deepEqual(result.data?.topQueries, []);
});

test('returns api_error (not a throw) when the Search Console API call rejects', async () => {
  const deps: SearchConsoleDependencies = {
    getSearchConsoleClient: () => ({ searchanalytics: { query: async () => { throw new Error('quota exceeded'); } } } as any),
  };
  const result = await fetchPagePerformance(`https://tutiba.com/blog/api-error-${Date.now()}`, deps);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'api_error');
});

test('caches a successful result so a second call does not hit the API again', async () => {
  const { client, calls } = buildClient({ totals: [{ clicks: 1, impressions: 2, ctr: 0.5, position: 3 }], queries: [] });
  const deps: SearchConsoleDependencies = { getSearchConsoleClient: () => client as any };
  const pageUrl = `https://tutiba.com/blog/cached-${Date.now()}`;

  await fetchPagePerformance(pageUrl, deps);
  await fetchPagePerformance(pageUrl, deps);

  assert.equal(calls.length, 2); // one totals + one queries call, from the single cache-missing first request
});

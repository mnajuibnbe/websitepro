import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createPerformanceHandler } from './search-console.routes.js';
import { buildPageUrl, type SearchConsoleResult } from '../services/searchConsole.service.js';

interface Scenario {
  authUser?: { id: string; app_metadata?: { role?: string } } | null;
  authError?: { message: string } | null;
  profileRole?: string | null;
  performanceResult?: SearchConsoleResult;
}

function buildAdmin(scenario: Scenario) {
  return {
    auth: {
      getUser: async (_token: string) => ({
        data: { user: scenario.authUser !== undefined ? scenario.authUser : { id: 'admin-1', app_metadata: {} } },
        error: scenario.authError ?? null,
      }),
    },
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          maybeSingle: async () => ({ data: scenario.profileRole !== undefined ? { role: scenario.profileRole } : { role: 'admin' }, error: null }),
        }),
      }),
    }),
  };
}

const SAMPLE_RESULT: SearchConsoleResult = {
  ok: true,
  data: { pageUrl: 'https://tutiba.com/blog/retinol-guide', clicks: 12, impressions: 340, ctr: 0.035, position: 8.2, topQueries: [{ query: 'retinol guide', clicks: 5, impressions: 100, ctr: 0.05, position: 6 }], rangeStart: '2026-07-01', rangeEnd: '2026-07-28' },
};

async function requestPerformance(scenario: Scenario = {}, query: Record<string, string> = { type: 'blog_post', slug: 'retinol-guide' }, headers: Record<string, string> = { authorization: 'Bearer valid-token' }) {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildAdmin(scenario);
  let calledWith: string | null = null;

  const handler = createPerformanceHandler({
    getSupabaseAdmin: () => admin as any,
    fetchPagePerformance: async (pageUrl: string) => {
      calledWith = pageUrl;
      return scenario.performanceResult ?? SAMPLE_RESULT;
    },
  });

  await handler({ query, headers } as unknown as Request, response as Response);
  return { ...state, calledWith };
}

test('rejects a missing Authorization header', async () => {
  const result = await requestPerformance({}, undefined, {});
  assert.equal(result.status, 401);
  assert.equal(result.calledWith, null);
});

test('rejects an invalid session', async () => {
  const result = await requestPerformance({ authUser: null, authError: { message: 'bad token' } });
  assert.equal(result.status, 401);
});

test('rejects a non-admin user', async () => {
  const result = await requestPerformance({ authUser: { id: 'user-1', app_metadata: {} }, profileRole: 'student' });
  assert.equal(result.status, 403);
});

test('allows an admin via app_metadata.role even if the profile role lags', async () => {
  const result = await requestPerformance({ authUser: { id: 'admin-1', app_metadata: { role: 'admin' } }, profileRole: 'student' });
  assert.equal(result.status, 200);
});

test('rejects an unknown type', async () => {
  const result = await requestPerformance({}, { type: 'lesson', slug: 'x' });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('rejects a missing or malformed blog slug', async () => {
  const result = await requestPerformance({}, { type: 'blog_post', slug: 'Not A Slug!' });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('rejects a course id that is not a UUID', async () => {
  const result = await requestPerformance({}, { type: 'course', id: 'not-a-uuid' });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('builds the blog post page URL and forwards it to the service', async () => {
  const result = await requestPerformance({}, { type: 'blog_post', slug: 'retinol-guide' });
  assert.equal(result.status, 200);
  assert.equal(result.calledWith, buildPageUrl('blog_post', 'retinol-guide'));
  assert.deepEqual(result.body, SAMPLE_RESULT.data);
});

test('builds the course page URL and forwards it to the service', async () => {
  const courseId = '123e4567-e89b-12d3-a456-426614174000';
  const result = await requestPerformance({}, { type: 'course', id: courseId });
  assert.equal(result.status, 200);
  assert.equal(result.calledWith, buildPageUrl('course', courseId));
});

test('returns 503 with a clear reason when Search Console is not configured', async () => {
  const result = await requestPerformance({ performanceResult: { ok: false, reason: 'missing_credentials', message: 'GOOGLE_SEARCH_CONSOLE_CREDENTIALS is not configured' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'missing_credentials');
  assert.doesNotMatch(result.body.error, /GOOGLE_SEARCH_CONSOLE_CREDENTIALS/);
});

test('returns 503 (not 500) when the Search Console API call itself fails', async () => {
  const result = await requestPerformance({ performanceResult: { ok: false, reason: 'api_error', message: 'network boom' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'api_error');
});

test('treats ok:true with no data as a failure rather than crashing', async () => {
  const result = await requestPerformance({ performanceResult: { ok: true } });
  assert.equal(result.status, 503);
});

test('returns 503 instead of hanging when the Supabase auth call rejects unexpectedly', async () => {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const handler = createPerformanceHandler({
    getSupabaseAdmin: () => ({ auth: { getUser: async () => { throw new Error('Supabase Auth outage'); } }, from: () => ({}) } as any),
    fetchPagePerformance: async () => { throw new Error('should not be reached'); },
  });

  await handler({ query: { type: 'blog_post', slug: 'retinol-guide' }, headers: { authorization: 'Bearer valid-token' } } as unknown as Request, response as Response);
  assert.equal(state.status, 503);
  assert.equal(state.body.reason, 'api_error');
});

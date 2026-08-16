import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createTopicInsightsHandler, createMetaDescriptionHandler } from './blog-insights.routes.js';
import type { GeminiInsightsResult, GeminiMetaDescriptionResult } from '../services/gemini.service.js';

interface Scenario {
  authUser?: { id: string; app_metadata?: { role?: string } } | null;
  authError?: { message: string } | null;
  profileRole?: string | null;
  insightsResult?: GeminiInsightsResult;
  metaDescriptionResult?: GeminiMetaDescriptionResult;
}

const NEVER_CALLED_TOPIC_INSIGHTS = async (): Promise<GeminiInsightsResult> => { throw new Error('generateTopicInsights should not be called from this handler'); };
const NEVER_CALLED_META_DESCRIPTION = async (): Promise<GeminiMetaDescriptionResult> => { throw new Error('generateMetaDescription should not be called from this handler'); };

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

async function requestInsights(scenario: Scenario = {}, body: unknown = { topic: 'retinol for sensitive skin', contentText: 'Some article content.' }, headers: Record<string, string> = { authorization: 'Bearer valid-token' }) {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildAdmin(scenario);
  let calledWith: [string, string, string | undefined] | null = null;

  const handler = createTopicInsightsHandler({
    getSupabaseAdmin: () => admin as any,
    generateTopicInsights: async (topic, contentText, apiKey) => {
      calledWith = [topic, contentText, apiKey];
      return scenario.insightsResult ?? { ok: true, insights: { subtopics: [{ topic: 'Patch testing', covered: false }], questions: ['How long until results?'] } };
    },
    generateMetaDescription: NEVER_CALLED_META_DESCRIPTION,
  });

  await handler({ body, headers } as unknown as Request, response as Response);
  return { ...state, calledWith };
}

async function requestMetaDescription(scenario: Scenario = {}, body: unknown = { title: 'Retinol for sensitive skin', excerpt: 'A gentle guide.', contentText: 'Some article content.', primaryKeyword: 'retinol sensitive skin' }, headers: Record<string, string> = { authorization: 'Bearer valid-token' }) {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildAdmin(scenario);
  let calledWith: [string, string, string, string, string | undefined] | null = null;

  const handler = createMetaDescriptionHandler({
    getSupabaseAdmin: () => admin as any,
    generateTopicInsights: NEVER_CALLED_TOPIC_INSIGHTS,
    generateMetaDescription: async (title, excerpt, contentText, primaryKeyword, apiKey) => {
      calledWith = [title, excerpt, contentText, primaryKeyword, apiKey];
      return scenario.metaDescriptionResult ?? { ok: true, description: 'A gentle, practical guide to starting retinol without irritation.' };
    },
  });

  await handler({ body, headers } as unknown as Request, response as Response);
  return { ...state, calledWith };
}

test('rejects a missing Authorization header', async () => {
  const result = await requestInsights({}, undefined, {});
  assert.equal(result.status, 401);
  assert.equal(result.calledWith, null);
});

test('rejects an invalid session', async () => {
  const result = await requestInsights({ authUser: null, authError: { message: 'bad token' } });
  assert.equal(result.status, 401);
});

test('rejects a non-admin user', async () => {
  const result = await requestInsights({ authUser: { id: 'user-1', app_metadata: {} }, profileRole: 'student' });
  assert.equal(result.status, 403);
});

test('allows an admin via app_metadata.role even if the profile role lags', async () => {
  const result = await requestInsights({ authUser: { id: 'admin-1', app_metadata: { role: 'admin' } }, profileRole: 'student' });
  assert.equal(result.status, 200);
});

test('rejects a missing or empty topic', async () => {
  const result = await requestInsights({}, { topic: '', contentText: '' });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('rejects an excessively long topic', async () => {
  const result = await requestInsights({}, { topic: 'x'.repeat(201), contentText: '' });
  assert.equal(result.status, 400);
});

test('rejects excessively long article content', async () => {
  const result = await requestInsights({}, { topic: 'retinol', contentText: 'x'.repeat(20001) });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('trims the topic and forwards it plus content to the Gemini service', async () => {
  const result = await requestInsights({}, { topic: '  retinol  ', contentText: 'Article text.' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.calledWith, ['retinol', 'Article text.', undefined]);
});

test('returns the insights payload directly on success', async () => {
  const insights = { subtopics: [{ topic: 'Dosage', covered: true }], questions: ['Is it safe during pregnancy?'] };
  const result = await requestInsights({ insightsResult: { ok: true, insights } });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, insights);
});

test('returns 503 with a clear message when the key is missing, without leaking internals', async () => {
  const result = await requestInsights({ insightsResult: { ok: false, reason: 'missing_key', message: 'GEMINI_API_KEY is not configured.' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'missing_key');
  assert.doesNotMatch(result.body.error, /GEMINI_API_KEY/);
});

test('returns 503 (not 500) when the Gemini API call itself fails', async () => {
  const result = await requestInsights({ insightsResult: { ok: false, reason: 'api_error', message: 'network boom' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'api_error');
});

test('returns 503 when the model response does not parse as expected', async () => {
  const result = await requestInsights({ insightsResult: { ok: false, reason: 'invalid_response', message: 'bad shape' } });
  assert.equal(result.status, 503);
});

test('treats ok:true with no insights payload as a failure rather than crashing', async () => {
  const result = await requestInsights({ insightsResult: { ok: true } });
  assert.equal(result.status, 503);
});

test('meta-description: rejects a missing Authorization header', async () => {
  const result = await requestMetaDescription({}, undefined, {});
  assert.equal(result.status, 401);
  assert.equal(result.calledWith, null);
});

test('meta-description: rejects a non-admin user', async () => {
  const result = await requestMetaDescription({ authUser: { id: 'user-1', app_metadata: {} }, profileRole: 'student' });
  assert.equal(result.status, 403);
});

test('meta-description: rejects a missing title', async () => {
  const result = await requestMetaDescription({}, { title: '', excerpt: '', contentText: '' });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('meta-description: rejects an excessively long title', async () => {
  const result = await requestMetaDescription({}, { title: 'x'.repeat(181), excerpt: '', contentText: '' });
  assert.equal(result.status, 400);
});

test('meta-description: rejects excessively long article content', async () => {
  const result = await requestMetaDescription({}, { title: 'Retinol', excerpt: '', contentText: 'x'.repeat(20001) });
  assert.equal(result.status, 400);
  assert.equal(result.calledWith, null);
});

test('meta-description: trims the title and forwards fields to the Gemini service', async () => {
  const result = await requestMetaDescription({}, { title: '  Retinol  ', excerpt: ' Gentle guide. ', contentText: 'Article text.', primaryKeyword: ' retinol ' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.calledWith, ['Retinol', 'Gentle guide.', 'Article text.', 'retinol', undefined]);
});

test('meta-description: returns the generated description directly on success', async () => {
  const result = await requestMetaDescription({ metaDescriptionResult: { ok: true, description: 'A calm, specific summary of the article.' } });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { description: 'A calm, specific summary of the article.' });
});

test('meta-description: returns 503 with a clear message when the key is missing, without leaking internals', async () => {
  const result = await requestMetaDescription({ metaDescriptionResult: { ok: false, reason: 'missing_key', message: 'GEMINI_API_KEY is not configured.' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'missing_key');
  assert.doesNotMatch(result.body.error, /GEMINI_API_KEY/);
});

test('meta-description: returns 503 (not 500) when the Gemini API call itself fails', async () => {
  const result = await requestMetaDescription({ metaDescriptionResult: { ok: false, reason: 'api_error', message: 'network boom' } });
  assert.equal(result.status, 503);
  assert.equal(result.body.reason, 'api_error');
});

test('meta-description: treats ok:true with no description as a failure rather than crashing', async () => {
  const result = await requestMetaDescription({ metaDescriptionResult: { ok: true } });
  assert.equal(result.status, 503);
});

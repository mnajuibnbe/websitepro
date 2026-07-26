import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createGenerateToken } from './video.controller.js';

interface Scenario {
  user?: { id: string } | null;
  userError?: unknown;
  lesson?: { video_url: string | null; course_id: string } | null;
  lessonError?: unknown;
  enrollment?: { id: string } | null;
  enrollmentError?: unknown;
  configurationError?: Error;
}

function createSupabase(scenario: Scenario) {
  const query = (result: { data: unknown; error: unknown }) => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      single: async () => result,
      maybeSingle: async () => result,
    };
    return builder;
  };

  return {
    auth: {
      getUser: async () => ({
        data: { user: scenario.user === undefined ? { id: 'user-1' } : scenario.user },
        error: scenario.userError ?? null,
      }),
    },
    from: (table: string) => table === 'lessons'
      ? query({
          data: scenario.lesson === undefined
            ? { video_url: 'https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view', course_id: 'course-1' }
            : scenario.lesson,
          error: scenario.lessonError ?? null,
        })
      : query({
          data: scenario.enrollment === undefined ? { id: 'enrollment-1' } : scenario.enrollment,
          error: scenario.enrollmentError ?? null,
        }),
  };
}

function createResponse() {
  const state: { status?: number; body?: any; headers: Record<string, string> } = { headers: {} };
  const response = {
    setHeader: (name: string, value: string) => { state.headers[name] = value; },
    status: (status: number) => {
      state.status = status;
      return response;
    },
    json: (body: unknown) => {
      state.body = body;
      return response;
    },
  } as unknown as Response;
  return { response, state };
}

async function requestToken(scenario: Scenario = {}, authorization = 'Bearer user-token') {
  const { response, state } = createResponse();
  const handler = createGenerateToken({
    getSupabaseAdmin: () => {
      if (scenario.configurationError) throw scenario.configurationError;
      return createSupabase(scenario) as any;
    },
    generateStreamToken: ({ fileId }) => `signed:${fileId}`,
    createCorrelationId: () => 'correlation-1',
  });
  await handler({
    body: { lessonId: 'lesson-1' },
    headers: authorization ? { authorization } : {},
  } as Request, response);
  return state;
}

test('returns a streaming token for an authenticated enrolled user', async () => {
  const result = await requestToken();
  assert.equal(result.status, 200);
  assert.match(result.body.token, /^signed:abcdefghijklmnopqrstuvwxyz123456$/);
});

test('rejects an unauthenticated request', async () => {
  const result = await requestToken({}, '');
  assert.equal(result.status, 401);
});

test('returns not found when the lesson does not exist', async () => {
  const result = await requestToken({ lesson: null, lessonError: { code: 'PGRST116' } });
  assert.equal(result.status, 404);
  assert.equal(result.body.error, 'Lesson not found');
});

test('rejects access without enrollment in the lesson course', async () => {
  const result = await requestToken({ enrollment: null });
  assert.equal(result.status, 403);
});

test('returns not found when the lesson has no video file ID', async () => {
  const result = await requestToken({ lesson: { video_url: null, course_id: 'course-1' } });
  assert.equal(result.status, 404);
  assert.equal(result.body.error, 'Lesson video not found');
});

test('returns a safe correlated error for server configuration failure', async () => {
  const result = await requestToken({ configurationError: new Error('secret internal configuration detail') });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, {
    error: 'Unable to authorize the video stream.',
    correlationId: 'correlation-1',
  });
  assert.equal(result.headers['X-Correlation-ID'], 'correlation-1');
});

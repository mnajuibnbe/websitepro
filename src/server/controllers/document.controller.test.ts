import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createDocumentToken } from './document.controller.js';

interface Scenario {
  user?: { id: string } | null;
  lesson?: Record<string, unknown> | null;
  enrollment?: { id: string } | null;
  metadata?: { mimeType: string | null; size: string | null; name: string | null };
}

function query(result: unknown) {
  const builder: any = { select: () => builder, eq: () => builder, single: async () => ({ data: result, error: result ? null : { code: 'PGRST116' } }), maybeSingle: async () => ({ data: result, error: null }) };
  return builder;
}

async function requestToken(scenario: Scenario = {}, authorization = 'Bearer session') {
  const state: { status?: number; body?: any; headers: Record<string, string> } = { headers: {} };
  const response: any = {
    setHeader: (name: string, value: string) => { state.headers[name] = value; },
    status: (status: number) => { state.status = status; return response; },
    json: (body: unknown) => { state.body = body; return response; },
  };
  const lesson = scenario.lesson === undefined ? {
    content_url: 'https://drive.google.com/file/d/1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ/view',
    content_type: 'pdf', lesson_type: 'pdf', course_id: 'course-1', is_published: true, deleted_at: null,
  } : scenario.lesson;
  const handler = createDocumentToken({
    getSupabaseAdmin: () => ({
      auth: { getUser: async () => ({ data: { user: scenario.user === undefined ? { id: 'user-1' } : scenario.user }, error: null }) },
      from: (table: string) => query(table === 'lessons' ? lesson : scenario.enrollment === undefined ? { id: 'enrollment-1' } : scenario.enrollment),
    } as any),
    getDriveMetadata: async () => scenario.metadata || { mimeType: 'application/pdf', size: '2048', name: 'lesson.pdf' },
    generateStreamToken: ({ fileId, resourceType }) => `${resourceType}:${fileId}`,
    createCorrelationId: () => 'correlation-1',
  });
  await handler({ body: { lessonId: 'lesson-1' }, headers: authorization ? { authorization } : {} } as Request, response as Response);
  return state;
}

test('authorizes an enrolled user for a published Drive PDF lesson', async () => {
  const result = await requestToken();
  assert.equal(result.status, 200);
  assert.equal(result.body.token, 'pdf:1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ');
});

test('rejects missing authentication or enrollment', async () => {
  assert.equal((await requestToken({}, '')).status, 401);
  assert.equal((await requestToken({ enrollment: null })).status, 403);
});

test('rejects unpublished, non-PDF, and invalid Drive content', async () => {
  assert.equal((await requestToken({ lesson: { is_published: false } })).status, 404);
  assert.equal((await requestToken({ lesson: { is_published: true, deleted_at: null, content_type: 'text', lesson_type: 'article' } })).status, 422);
  assert.equal((await requestToken({ metadata: { mimeType: 'text/plain', size: '10', name: 'lesson.txt' } })).status, 422);
});

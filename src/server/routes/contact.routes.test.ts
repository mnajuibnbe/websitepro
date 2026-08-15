import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createContactHandler, createContactReplyHandler } from './contact.routes.js';

const VALID_BODY = { name: 'Jane Doe', email: 'jane@example.com', phone: '+201065826509', topic: 'support', message: 'Hello there' };

interface Scenario {
  recentSubmissions?: unknown[];
  recentError?: { message: string } | null;
  insertResult?: { data: { id: string } | null; error: { message: string } | null };
  emailResult?: { sent: boolean; error?: string };
}

function buildAdmin(scenario: Scenario) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  return {
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          gte: (_col2: string, _val2: unknown) => ({
            limit: async (_n: number) => {
              calls.push({ table, op: 'select-recent' });
              return { data: scenario.recentSubmissions ?? [], error: scenario.recentError ?? null };
            },
          }),
        }),
      }),
      insert: (payload: unknown) => ({
        select: (_cols: string) => ({
          single: async () => {
            calls.push({ table, op: 'insert', payload });
            return scenario.insertResult ?? { data: { id: 'submission-1' }, error: null };
          },
        }),
      }),
      update: (payload: unknown) => ({
        eq: async (_col: string, _val: unknown) => {
          calls.push({ table, op: 'update', payload });
          return { data: null, error: null };
        },
      }),
    }),
    __calls: calls,
  };
}

async function requestContact(scenario: Scenario = {}, body: unknown = VALID_BODY) {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildAdmin(scenario);

  const handler = createContactHandler({
    getSupabaseAdmin: () => admin as any,
    sendEmail: async () => scenario.emailResult ?? { sent: true },
  });

  await handler({ body } as Request, response as Response);
  return { ...state, calls: admin.__calls };
}

test('stores a valid submission and returns 201', async () => {
  const result = await requestContact();
  assert.equal(result.status, 201);
  assert.equal(result.body.id, 'submission-1');
  assert.deepEqual(result.calls.map((c) => c.op), ['select-recent', 'insert']);
});

test('rejects missing or invalid required fields', async () => {
  assert.equal((await requestContact({}, { ...VALID_BODY, name: '' })).status, 400);
  assert.equal((await requestContact({}, { ...VALID_BODY, email: 'not-an-email' })).status, 400);
  assert.equal((await requestContact({}, { ...VALID_BODY, message: '' })).status, 400);
});

test('falls back topic to "other" when missing or invalid', async () => {
  const result = await requestContact({}, { ...VALID_BODY, topic: 'nonsense' });
  assert.equal(result.status, 201);
  const insertCall = result.calls.find((c) => c.op === 'insert');
  assert.equal((insertCall!.payload as any).topic, 'other');
});

test('rejects a repeat submission from the same email within the rate-limit window', async () => {
  const result = await requestContact({ recentSubmissions: [{ id: 'existing' }] });
  assert.equal(result.status, 429);
  assert.deepEqual(result.calls.map((c) => c.op), ['select-recent']);
});

test('500s when the rate-limit check itself fails, without inserting', async () => {
  const result = await requestContact({ recentError: { message: 'connection reset' } });
  assert.equal(result.status, 500);
  assert.deepEqual(result.calls.map((c) => c.op), ['select-recent']);
});

test('500s when the insert fails', async () => {
  const result = await requestContact({ insertResult: { data: null, error: { message: 'insert failed' } } });
  assert.equal(result.status, 500);
});

test('still returns success when the confirmation email fails, but marks the row', async () => {
  const result = await requestContact({ emailResult: { sent: false, error: 'Resend down' } });
  assert.equal(result.status, 201);
  const updateCall = result.calls.find((c) => c.op === 'update');
  assert.deepEqual(updateCall!.payload, { status: 'email_failed' });
});

const SUBMISSION_ID = '11111111-1111-1111-1111-111111111111';

interface ReplyScenario {
  user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  authError?: { message: string } | null;
  profile?: { role: string } | null;
  submission?: { name: string; email: string; message: string; read_at: string | null } | null;
  fetchError?: { message: string } | null;
  insertResult?: { data: { id: string } | null; error: { message: string } | null };
  emailResult?: { sent: boolean; error?: string };
}

function buildReplyAdmin(scenario: ReplyScenario) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  return {
    auth: {
      getUser: async (_token: string) => ({
        data: { user: scenario.user === undefined ? { id: 'admin-1', app_metadata: { role: 'admin' } } : scenario.user },
        error: scenario.authError ?? null,
      }),
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (_cols: string) => ({
            eq: (_col: string, _val: unknown) => ({
              maybeSingle: async () => {
                calls.push({ table, op: 'select-profile' });
                return { data: scenario.profile === undefined ? { role: 'admin' } : scenario.profile, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'contact_submissions') {
        return {
          select: (_cols: string) => ({
            eq: (_col: string, _val: unknown) => ({
              maybeSingle: async () => {
                calls.push({ table, op: 'select-submission' });
                if (scenario.fetchError) return { data: null, error: scenario.fetchError };
                return { data: scenario.submission === undefined ? { name: 'Jane Doe', email: 'jane@example.com', message: 'Original message', read_at: null } : scenario.submission, error: null };
              },
            }),
          }),
          update: (payload: unknown) => ({
            eq: async (_col: string, _val: unknown) => {
              calls.push({ table, op: 'update', payload });
              return { data: null, error: null };
            },
          }),
        };
      }
      if (table === 'contact_submission_replies') {
        return {
          insert: (payload: unknown) => ({
            select: (_cols: string) => ({
              single: async () => {
                calls.push({ table, op: 'insert', payload });
                return scenario.insertResult ?? { data: { id: 'reply-1' }, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in reply test mock: ${table}`);
    },
    __calls: calls,
  };
}

async function requestReply(scenario: ReplyScenario = {}, body: unknown = { message: '<p>Thanks for reaching out.</p>' }, params: unknown = { id: SUBMISSION_ID }, authorization = 'Bearer admin-session') {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildReplyAdmin(scenario);

  const handler = createContactReplyHandler({
    getSupabaseAdmin: () => admin as any,
    sendEmail: async () => scenario.emailResult ?? { sent: true },
  });

  await handler({ body, params, headers: authorization ? { authorization } : {} } as unknown as Request, response as Response);
  return { ...state, calls: admin.__calls };
}

test('reply: rejects missing authentication', async () => {
  assert.equal((await requestReply({}, undefined, undefined, '')).status, 401);
});

test('reply: rejects an invalid session', async () => {
  const result = await requestReply({ user: null, authError: { message: 'expired' } });
  assert.equal(result.status, 401);
});

test('reply: rejects a non-admin user', async () => {
  const result = await requestReply({ user: { id: 'user-1', app_metadata: {} }, profile: { role: 'student' } });
  assert.equal(result.status, 403);
});

test('reply: rejects an invalid submission ID', async () => {
  const result = await requestReply({}, undefined, { id: 'not-a-uuid' });
  assert.equal(result.status, 400);
});

test('reply: rejects an empty or whitespace-only message', async () => {
  assert.equal((await requestReply({}, { message: '' })).status, 400);
  assert.equal((await requestReply({}, { message: '<p>   </p>' })).status, 400);
});

test('reply: 404s when the submission does not exist', async () => {
  const result = await requestReply({ submission: null });
  assert.equal(result.status, 404);
});

test('reply: 500s when the submission lookup fails', async () => {
  const result = await requestReply({ fetchError: { message: 'connection reset' } });
  assert.equal(result.status, 500);
});

test('reply: stores the reply, emails the visitor, and marks the submission replied and read', async () => {
  const result = await requestReply({ submission: { name: 'Jane Doe', email: 'jane@example.com', message: 'Original message', read_at: null } });
  assert.equal(result.status, 201);
  assert.equal(result.body.id, 'reply-1');
  const insertCall = result.calls.find((c) => c.op === 'insert');
  assert.equal((insertCall!.payload as any).email_status, 'sent');
  const updateCall = result.calls.find((c) => c.op === 'update');
  assert.ok((updateCall!.payload as any).replied_at);
  assert.ok((updateCall!.payload as any).read_at, 'read_at should be backfilled when it was previously null');
});

test('reply: does not overwrite an already-set read_at', async () => {
  const result = await requestReply({ submission: { name: 'Jane Doe', email: 'jane@example.com', message: 'Original message', read_at: '2026-08-01T00:00:00.000Z' } });
  const updateCall = result.calls.find((c) => c.op === 'update');
  assert.equal((updateCall!.payload as any).read_at, undefined);
});

test('reply: 502s and marks email_status failed when the send fails, but keeps the saved reply', async () => {
  const result = await requestReply({ emailResult: { sent: false, error: 'Resend down' } });
  assert.equal(result.status, 502);
  assert.equal(result.body.id, 'reply-1');
  const insertCall = result.calls.find((c) => c.op === 'insert');
  assert.equal((insertCall!.payload as any).email_status, 'failed');
});

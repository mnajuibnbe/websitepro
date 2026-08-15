import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createContactHandler } from './contact.routes.js';

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

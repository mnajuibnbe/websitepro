import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createResendInboundWebhookHandler } from './contact-inbound.routes.js';
import type { ReceivedEmail } from '../services/email.service.js';

const SUBMISSION_ID = '11111111-1111-1111-1111-111111111111';

interface Scenario {
  verified?: boolean;
  email?: ReceivedEmail | null;
  upsertResult?: { data: { id: string } | null; error: { code?: string; message: string } | null };
}

function buildAdmin(scenario: Scenario) {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  return {
    from: (table: string) => {
      if (table === 'contact_submission_replies') {
        return {
          upsert: (payload: unknown, _opts: unknown) => ({
            select: (_cols: string) => ({
              maybeSingle: async () => {
                calls.push({ table, op: 'upsert', payload });
                return scenario.upsertResult ?? { data: { id: 'reply-1' }, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'contact_submissions') {
        return {
          update: (payload: unknown) => ({
            eq: async (_col: string, _val: unknown) => {
              calls.push({ table, op: 'update', payload });
              return { data: null, error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table in inbound webhook test mock: ${table}`);
    },
    __calls: calls,
  };
}

const DEFAULT_EMAIL: ReceivedEmail = {
  id: 'email-1',
  to: [`reply+${SUBMISSION_ID}@abc123.resend.app`],
  cc: [],
  from: 'Jane Doe <jane@example.com>',
  subject: 'Re: your message',
  html: null,
  text: 'Thanks, that answers it!\n\nOn Mon, Jan 5, 2026 at 10:00 AM Support <support@tutiba.com> wrote:\n> original text',
  attachments: [],
};

function buildRequest(body: Record<string, unknown> = { type: 'email.received', data: { email_id: 'email-1', to: DEFAULT_EMAIL.to } }): Request {
  return {
    body: Buffer.from(JSON.stringify(body)),
    header: (_name: string) => 'stub',
  } as unknown as Request;
}

async function invoke(scenario: Scenario = {}, body?: Record<string, unknown>) {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const admin = buildAdmin(scenario);

  const handler = createResendInboundWebhookHandler({
    getSupabaseAdmin: () => admin as any,
    fetchReceivedEmail: async () => (scenario.email === undefined ? DEFAULT_EMAIL : scenario.email),
    verifySignature: () => scenario.verified ?? true,
  });

  await handler(buildRequest(body), response as Response);
  return { ...state, calls: admin.__calls };
}

test('rejects an unverified signature without touching the database', async () => {
  const result = await invoke({ verified: false });
  assert.equal(result.status, 401);
  assert.equal(result.calls.length, 0);
});

test('acks and ignores an event type other than email.received', async () => {
  const result = await invoke({}, { type: 'email.sent', data: {} });
  assert.equal(result.status, 200);
  assert.equal(result.body.skipped, true);
  assert.equal(result.calls.length, 0);
});

test('400s when email_id is missing', async () => {
  const result = await invoke({}, { type: 'email.received', data: {} });
  assert.equal(result.status, 400);
});

test('acks and drops an inbound email with no matching reply token', async () => {
  const result = await invoke({}, { type: 'email.received', data: { email_id: 'email-1', to: ['random@abc123.resend.app'] } });
  assert.equal(result.status, 200);
  assert.equal(result.body.unmatched, true);
  assert.equal(result.calls.length, 0);
});

test('finds the reply token in cc or received_for when not in to', async () => {
  const result = await invoke({}, { type: 'email.received', data: { email_id: 'email-1', to: ['other@abc123.resend.app'], cc: [`reply+${SUBMISSION_ID}@abc123.resend.app`] } });
  assert.equal(result.status, 200);
  const upsertCall = result.calls.find((c) => c.op === 'upsert');
  assert.equal((upsertCall!.payload as any).submission_id, SUBMISSION_ID);
});

test('502s when the received email body cannot be fetched', async () => {
  const result = await invoke({ email: null });
  assert.equal(result.status, 502);
  assert.equal(result.calls.length, 0);
});

test('stores the visitor reply with quoted content stripped and reopens the thread', async () => {
  const result = await invoke();
  assert.equal(result.status, 200);
  const upsertCall = result.calls.find((c) => c.op === 'upsert')!.payload as any;
  assert.equal(upsertCall.sender_type, 'visitor');
  assert.equal(upsertCall.admin_id, null);
  assert.equal(upsertCall.visitor_email, 'jane@example.com');
  assert.equal(upsertCall.message_html, 'Thanks, that answers it!');
  assert.equal(upsertCall.is_html, false);
  assert.equal(upsertCall.resend_email_id, 'email-1');
  const updateCall = result.calls.find((c) => c.op === 'update')!.payload as any;
  assert.deepEqual(updateCall, { read_at: null, resolved_at: null });
});

test('records attachment_count without storing attachment content', async () => {
  const result = await invoke({ email: { ...DEFAULT_EMAIL, attachments: [{ id: 'a1', filename: 'photo.png' }, { id: 'a2', filename: 'doc.pdf' }] } });
  const upsertCall = result.calls.find((c) => c.op === 'upsert')!.payload as any;
  assert.equal(upsertCall.attachment_count, 2);
  assert.ok(!('attachments' in upsertCall));
});

test('falls back to a placeholder visitor_email when the From header is unparseable', async () => {
  const result = await invoke({ email: { ...DEFAULT_EMAIL, from: 'not a real header value' } });
  const upsertCall = result.calls.find((c) => c.op === 'upsert')!.payload as any;
  assert.equal(upsertCall.visitor_email, 'unknown-sender@invalid.local');
});

test('is idempotent: a duplicate delivery (ignoreDuplicates, no row returned) does not reopen the thread', async () => {
  const result = await invoke({ upsertResult: { data: null, error: null } });
  assert.equal(result.status, 200);
  assert.equal(result.body.duplicate, true);
  assert.equal(result.calls.find((c) => c.op === 'update'), undefined);
});

test('acks a reply token pointing at a submission that no longer exists (FK violation)', async () => {
  const result = await invoke({ upsertResult: { data: null, error: { code: '23503', message: 'fk violation' } } });
  assert.equal(result.status, 200);
  assert.equal(result.body.unmatched, true);
});

test('500s on an unexpected database error', async () => {
  const result = await invoke({ upsertResult: { data: null, error: { code: '08000', message: 'connection reset' } } });
  assert.equal(result.status, 500);
});

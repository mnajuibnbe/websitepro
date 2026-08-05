import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { createCheckoutHandler } from './checkout.routes.js';

const COURSE_ID = '11111111-1111-1111-1111-111111111111';

interface Scenario {
  user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  course?: Record<string, unknown> | null;
  rpcResult?: { data: unknown; error: { code?: string; message: string } | null };
  amountToMinorUnitsThrows?: boolean;
}

function courseQuery(course: unknown) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    single: async () => ({ data: course, error: course ? null : { message: 'not found' } }),
  };
  return builder;
}

async function requestCheckout(scenario: Scenario = {}, body: unknown = { courseId: COURSE_ID }, authorization = 'Bearer session') {
  const state: { status?: number; body?: any } = {};
  const response: any = {
    status: (status: number) => { state.status = status; return response; },
    json: (payload: unknown) => { state.body = payload; return response; },
  };
  const course = scenario.course === undefined
    ? { id: COURSE_ID, title: 'Course', status: 'published', price_egp: 500, price_usd: 20 }
    : scenario.course;
  const fromCalls: string[] = [];
  const rpcCalls: Array<{ fn: string; args: unknown }> = [];

  const handler = createCheckoutHandler({
    getSupabaseAdmin: () => ({
      auth: { getUser: async () => ({ data: { user: scenario.user === undefined ? { id: 'user-1', app_metadata: {} } : scenario.user }, error: null }) },
      from: (table: string) => { fromCalls.push(table); return courseQuery(course); },
      rpc: async (fn: string, args: unknown) => {
        rpcCalls.push({ fn, args });
        return scenario.rpcResult ?? { data: { id: 'order-1', enrollment_id: 'enrollment-1', ...(args as object) }, error: null };
      },
    } as any),
    resolveServerPricingContext: () => ({ countryCode: null, countryGroup: 'international', currency: 'USD', source: 'default' }),
    amountToMinorUnits: (amount: string) => {
      if (scenario.amountToMinorUnitsThrows) throw new Error('Invalid authoritative amount');
      return BigInt(Math.round(Number(amount) * 100));
    },
  });

  await handler({ body, headers: authorization ? { authorization } : {} } as Request, response as Response);
  return { ...state, fromCalls, rpcCalls };
}

test('creates the order via a single atomic RPC call', async () => {
  const result = await requestCheckout();
  assert.equal(result.status, 201);
  assert.equal(result.body.order.id, 'order-1');
  assert.equal(result.rpcCalls.length, 1);
  assert.equal(result.rpcCalls[0].fn, 'checkout_create_order');
  assert.deepEqual(result.rpcCalls[0].args, {
    p_course_id: COURSE_ID,
    p_user_id: 'user-1',
    p_amount: '20',
    p_currency: 'USD',
    p_pricing_region: 'international',
    p_pricing_source: 'default',
  });
  // No separate order/enrollment writes from the route itself — the RPC is the only mutation.
  assert.deepEqual(result.fromCalls, ['courses']);
});

test('rejects missing authentication and invalid course IDs', async () => {
  assert.equal((await requestCheckout({}, { courseId: COURSE_ID }, '')).status, 401);
  assert.equal((await requestCheckout({}, { courseId: 'not-a-uuid' })).status, 400);
});

test('404s when the course is missing or unpublished', async () => {
  const result = await requestCheckout({ course: null });
  assert.equal(result.status, 404);
  assert.equal(result.rpcCalls.length, 0);
});

test('409s when the resolved currency has no price, 500s on an invalid amount', async () => {
  const noPrice = await requestCheckout({ course: { id: COURSE_ID, status: 'published', price_egp: 500, price_usd: null } });
  assert.equal(noPrice.status, 409);
  assert.equal(noPrice.rpcCalls.length, 0);

  const badAmount = await requestCheckout({ amountToMinorUnitsThrows: true });
  assert.equal(badAmount.status, 500);
  assert.equal(badAmount.rpcCalls.length, 0);
});

test('surfaces the duplicate-enrollment conflict from the database with its user-facing message', async () => {
  const active = await requestCheckout({ rpcResult: { data: null, error: { code: '23505', message: 'You are already enrolled in this course.' } } });
  assert.equal(active.status, 409);
  assert.equal(active.body.error, 'You are already enrolled in this course.');

  const pending = await requestCheckout({ rpcResult: { data: null, error: { code: '23505', message: 'Your enrollment request is already pending.' } } });
  assert.equal(pending.status, 409);
  assert.equal(pending.body.error, 'Your enrollment request is already pending.');
});

test('surfaces a race where the course was unpublished between the read and the RPC call', async () => {
  const result = await requestCheckout({ rpcResult: { data: null, error: { code: 'P0002', message: 'Published course not found' } } });
  assert.equal(result.status, 404);
  assert.equal(result.body.error, 'Published course not found');
});

test('a failed atomic RPC call leaves no partial state and reports a plain failure', async () => {
  const result = await requestCheckout({ rpcResult: { data: null, error: { message: 'connection reset' } } });
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'Could not create order');
  // The route never falls back to separate order/enrollment inserts on RPC failure.
  assert.deepEqual(result.fromCalls, ['courses']);
});

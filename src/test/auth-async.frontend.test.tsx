import assert from 'node:assert/strict';
import test from 'node:test';
import { runAuthRequest } from '../lib/authAsync';

test('returns successful authentication requests', async () => {
  assert.equal(await runAuthRequest(Promise.resolve('session'), 50), 'session');
});

test('stops waiting for an unresponsive authentication service', async () => {
  await assert.rejects(runAuthRequest(new Promise(() => undefined), 5), /took too long/);
});

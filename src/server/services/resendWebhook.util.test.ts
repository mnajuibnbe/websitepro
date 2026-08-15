import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { verifyResendWebhookSignature } from './resendWebhook.util.js';

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

function sign(id: string, timestamp: string, body: string, secret = SECRET): string {
  const key = Buffer.from(secret.slice('whsec_'.length), 'base64');
  const digest = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`, 'utf8').digest('base64');
  return `v1,${digest}`;
}

test('accepts a correctly signed payload', () => {
  const body = '{"type":"email.received","data":{"email_id":"abc"}}';
  const id = 'msg_1';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(id, timestamp, body);
  assert.equal(
    verifyResendWebhookSignature(Buffer.from(body), { id, timestamp, signature }, SECRET),
    true,
  );
});

test('accepts when the matching signature is one of several space-delimited values', () => {
  const body = '{"ok":true}';
  const id = 'msg_2';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const real = sign(id, timestamp, body);
  const bogus = 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  assert.equal(
    verifyResendWebhookSignature(Buffer.from(body), { id, timestamp, signature: `${bogus} ${real}` }, SECRET),
    true,
  );
});

test('rejects a tampered body', () => {
  const body = '{"type":"email.received"}';
  const id = 'msg_3';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(id, timestamp, body);
  assert.equal(
    verifyResendWebhookSignature(Buffer.from('{"type":"email.received","tampered":true}'), { id, timestamp, signature }, SECRET),
    false,
  );
});

test('rejects the wrong secret', () => {
  const body = '{"ok":true}';
  const id = 'msg_4';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(id, timestamp, body, 'whsec_differentSecretValueHere1234');
  assert.equal(
    verifyResendWebhookSignature(Buffer.from(body), { id, timestamp, signature }, SECRET),
    false,
  );
});

test('rejects a stale timestamp (replay protection)', () => {
  const body = '{"ok":true}';
  const id = 'msg_5';
  const timestamp = String(Math.floor(Date.now() / 1000) - 60 * 60);
  const signature = sign(id, timestamp, body);
  assert.equal(
    verifyResendWebhookSignature(Buffer.from(body), { id, timestamp, signature }, SECRET),
    false,
  );
});

test('rejects when headers are missing', () => {
  assert.equal(
    verifyResendWebhookSignature(Buffer.from('{}'), { id: undefined, timestamp: undefined, signature: undefined }, SECRET),
    false,
  );
});

test('rejects when the webhook secret is not configured', () => {
  const body = '{"ok":true}';
  const id = 'msg_6';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(id, timestamp, body);
  assert.equal(
    verifyResendWebhookSignature(Buffer.from(body), { id, timestamp, signature }, undefined),
    false,
  );
});

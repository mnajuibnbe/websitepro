import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import app from '../../api/index';

const WEBHOOK_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

function signWebhookBody(id: string, timestamp: string, body: string): string {
  const key = Buffer.from(WEBHOOK_SECRET.slice('whsec_'.length), 'base64');
  const digest = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`, 'utf8').digest('base64');
  return `v1,${digest}`;
}

test('Vercel entrypoint exposes authenticated media metadata verification', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/media/video-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view' }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Authentication required.' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('Vercel entrypoint exposes authenticated document authorization', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/documents/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: '00000000-0000-0000-0000-000000000000' }),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized: Missing or invalid Authorization header' });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('Vercel entrypoint exposes contact form validation', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
    });
    // Reaching the route's own validation (400, not a 404 from a missing
    // mount) is what actually proves it's wired into this entrypoint --
    // the one Vercel serves in production, distinct from server.ts.
    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

// The webhook route needs the exact raw request bytes to verify Resend's
// signature (see contact-inbound.routes.ts). That only works if it's
// mounted before express.json() in api/index.ts -- if json() ran first it
// would consume the body stream and every signature check would fail, no
// matter how correct the verification code itself is. These two tests
// exercise that through the real Vercel entrypoint (not a route-level
// mock) so a future reordering of api/index.ts's middleware would be
// caught here. They stop short of a submission match so the handler never
// reaches the database, which isn't configured in this test environment.
test('Vercel entrypoint verifies the Resend inbound webhook signature against the true raw body', async () => {
  const server = app.listen(0);
  const originalSecret = process.env.RESEND_WEBHOOK_SECRET;
  process.env.RESEND_WEBHOOK_SECRET = WEBHOOK_SECRET;

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const body = JSON.stringify({ type: 'email.received', data: { email_id: 'email-1', to: ['nobody@abc123.resend.app'] } });
    const id = 'msg_test';
    const timestamp = String(Math.floor(Date.now() / 1000));

    const signed = await fetch(`http://127.0.0.1:${address.port}/api/webhooks/resend-inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signWebhookBody(id, timestamp, body),
      },
      body,
    });
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { ok: true, unmatched: true });

    const unsigned = await fetch(`http://127.0.0.1:${address.port}/api/webhooks/resend-inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      },
      body,
    });
    assert.equal(unsigned.status, 401);
  } finally {
    process.env.RESEND_WEBHOOK_SECRET = originalSecret;
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

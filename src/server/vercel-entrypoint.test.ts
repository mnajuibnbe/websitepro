import assert from 'node:assert/strict';
import test from 'node:test';
import app from '../../api/index';

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

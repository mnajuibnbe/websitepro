import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { verifyStreamToken } from '../src/index';

const secret = 'worker-token-compatibility-test-secret';

test('accepts the exact HS256 token emitted by the Vercel token service', async () => {
  const token = jwt.sign({ fileId: 'drive-file-123', resourceType: 'video' }, secret, { expiresIn: '2h' });
  const payload = await verifyStreamToken(token, secret, 'video');
  assert.equal(payload.fileId, 'drive-file-123');
  assert.equal(payload.resourceType, 'video');
  assert.equal(typeof payload.iat, 'number');
  assert.equal(payload.exp! - payload.iat!, 2 * 60 * 60);
});

test('accepts a pdf token when pdf is expected', async () => {
  const token = jwt.sign({ fileId: 'drive-file-456', resourceType: 'pdf' }, secret, { expiresIn: '2h' });
  const payload = await verifyStreamToken(token, secret, 'pdf');
  assert.equal(payload.fileId, 'drive-file-456');
  assert.equal(payload.resourceType, 'pdf');
});

test('rejects an expired token and a token signed with another secret', async () => {
  const expired = jwt.sign({ fileId: 'drive-file-123', resourceType: 'video' }, secret, { expiresIn: -1 });
  await assert.rejects(() => verifyStreamToken(expired, secret, 'video'), /expired/i);
  const wrongSignature = jwt.sign({ fileId: 'drive-file-123', resourceType: 'video' }, 'another-secret', { expiresIn: '2h' });
  await assert.rejects(() => verifyStreamToken(wrongSignature, secret, 'video'), /signature/i);
});

test('preserves the resource-type scope in both directions', async () => {
  const documentToken = jwt.sign({ fileId: 'drive-file-123', resourceType: 'pdf' }, secret, { expiresIn: '2h' });
  await assert.rejects(() => verifyStreamToken(documentToken, secret, 'video'), /video streaming/i);
  const videoToken = jwt.sign({ fileId: 'drive-file-123', resourceType: 'video' }, secret, { expiresIn: '2h' });
  await assert.rejects(() => verifyStreamToken(videoToken, secret, 'pdf'), /pdf streaming/i);
});

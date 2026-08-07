import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAYMENT_PROOF_MAX_BYTES,
  buildPaymentProofPath,
  getAvailablePaymentMethods,
  validatePaymentProofFile,
} from '../lib/paymentProof';

test('EGP orders allow all three manual payment methods', () => {
  assert.deepEqual(getAvailablePaymentMethods('EGP'), ['bank_transfer', 'instapay', 'vodafone_cash']);
});

test('USD orders only allow bank transfer', () => {
  assert.deepEqual(getAvailablePaymentMethods('USD'), ['bank_transfer']);
});

test('accepts jpeg, png, and webp under the size limit', () => {
  assert.equal(validatePaymentProofFile({ type: 'image/jpeg', size: 1024 }), null);
  assert.equal(validatePaymentProofFile({ type: 'image/png', size: 1024 }), null);
  assert.equal(validatePaymentProofFile({ type: 'image/webp', size: PAYMENT_PROOF_MAX_BYTES }), null);
});

test('rejects disallowed file types', () => {
  assert.match(validatePaymentProofFile({ type: 'application/pdf', size: 1024 }) ?? '', /JPG, PNG, or WebP/);
  assert.match(validatePaymentProofFile({ type: 'image/gif', size: 1024 }) ?? '', /JPG, PNG, or WebP/);
});

test('rejects files over 10 MB', () => {
  const error = validatePaymentProofFile({ type: 'image/png', size: PAYMENT_PROOF_MAX_BYTES + 1 });
  assert.match(error ?? '', /10 MB/);
});

test('builds a collision-safe path scoped to the uploader', () => {
  const path = buildPaymentProofPath('user-123', 'image/jpeg');
  assert.match(path, /^user-123\/[0-9a-f-]{36}\.jpg$/);
  const second = buildPaymentProofPath('user-123', 'image/jpeg');
  assert.notEqual(path, second);
});

test('maps each accepted mime type to its file extension', () => {
  assert.match(buildPaymentProofPath('u', 'image/png'), /\.png$/);
  assert.match(buildPaymentProofPath('u', 'image/webp'), /\.webp$/);
});

// Adversarial: a 0-byte or negative-size "file" cannot be a real payment
// screenshot. validatePaymentProofFile only checks size > MAX_BYTES, so
// these currently pass through as valid — a defect, not an assumption.
test('rejects a zero-byte file', () => {
  assert.notEqual(validatePaymentProofFile({ type: 'image/png', size: 0 }), null);
});

test('rejects a file reporting a negative size', () => {
  assert.notEqual(validatePaymentProofFile({ type: 'image/jpeg', size: -1024 }), null);
});

test('rejects SVG images (script-capable) even though they are commonly mistaken for safe raster images', () => {
  assert.match(validatePaymentProofFile({ type: 'image/svg+xml', size: 1024 }) ?? '', /JPG, PNG, or WebP/);
});

test('mime type matching is case-sensitive: an uppercase-labeled type is rejected rather than normalized', () => {
  assert.notEqual(validatePaymentProofFile({ type: 'IMAGE/PNG', size: 1024 }), null);
});

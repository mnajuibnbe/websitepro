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

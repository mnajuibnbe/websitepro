import assert from 'node:assert/strict';
import test from 'node:test';
import { originalValueScore, ORIGINAL_VALUE_TARGET } from './blogOriginalValue';

test('no signals scores 0', () => {
  assert.equal(originalValueScore([]), 0);
});

test('reaching the target scores 100', () => {
  const signals = Array.from({ length: ORIGINAL_VALUE_TARGET }, (_, i) => `signal-${i}` as never);
  assert.equal(originalValueScore(signals), 100);
});

test('exceeding the target caps at 100', () => {
  const signals = Array.from({ length: ORIGINAL_VALUE_TARGET + 5 }, (_, i) => `signal-${i}` as never);
  assert.equal(originalValueScore(signals), 100);
});

test('partial credit scales linearly toward the target', () => {
  const one = originalValueScore(['personal_experience']);
  const two = originalValueScore(['personal_experience', 'data']);
  assert.ok(one > 0 && one < 100);
  assert.ok(two > one);
});

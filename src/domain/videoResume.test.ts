import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlaybackStartAt, shouldSkipNearEndResume } from './videoResume';

test('resolvePlaybackStartAt treats a null saved position (never started) as no resume target', () => {
  assert.equal(resolvePlaybackStartAt(null), undefined);
  assert.equal(resolvePlaybackStartAt(undefined), undefined);
});

test('resolvePlaybackStartAt treats a saved position of exactly 0:00 as no resume target', () => {
  assert.equal(resolvePlaybackStartAt(0), undefined);
});

test('resolvePlaybackStartAt treats a negative saved position defensively as no resume target', () => {
  assert.equal(resolvePlaybackStartAt(-5), undefined);
});

test('resolvePlaybackStartAt resumes to a known positive saved position, e.g. 142 seconds', () => {
  assert.equal(resolvePlaybackStartAt(142), 142);
});

test('shouldSkipNearEndResume skips when the saved position is within the threshold of the loaded duration', () => {
  // 600s video, saved at 590s, 15s threshold -> only 10s of runway left, skip.
  assert.equal(shouldSkipNearEndResume(600, 590, 15), true);
});

test('shouldSkipNearEndResume does not skip when the saved position is comfortably before the end', () => {
  // 600s video, saved at 142s -> plenty of runway, resume normally.
  assert.equal(shouldSkipNearEndResume(600, 142, 15), false);
});

test('shouldSkipNearEndResume treats the boundary itself (exactly threshold seconds of runway) as not near the end', () => {
  // 600s video, saved at 585s, 15s threshold -> exactly 15s of runway remains.
  assert.equal(shouldSkipNearEndResume(600, 585, 15), false);
});

test('shouldSkipNearEndResume never skips when duration is unknown (0 or non-finite)', () => {
  assert.equal(shouldSkipNearEndResume(0, 590, 15), false);
  assert.equal(shouldSkipNearEndResume(NaN, 590, 15), false);
  assert.equal(shouldSkipNearEndResume(Infinity, 590, 15), false);
});

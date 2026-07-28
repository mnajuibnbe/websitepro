import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSafeReturnPath } from '../lib/authRouting';

test('preserves safe internal authentication return locations', () => {
  assert.equal(resolveSafeReturnPath('/learn/course-1?tab=notes#lesson'), '/learn/course-1?tab=notes#lesson');
  assert.equal(resolveSafeReturnPath({ pathname: '/checkout', search: '?course=1', hash: '#payment' }), '/checkout?course=1#payment');
});

test('rejects external, malformed, and guest-only authentication destinations', () => {
  for (const destination of ['https://example.com', '//example.com', '/\\example.com', '/login', '/register', '/update-password']) {
    assert.equal(resolveSafeReturnPath(destination), '/dashboard');
  }
  assert.equal(resolveSafeReturnPath(undefined, '/courses'), '/courses');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthErrorMessage } from '../lib/authErrors';

test('normalizes identity-provider authentication failures', () => {
  assert.equal(getAuthErrorMessage(new Error('Invalid login credentials'), 'login'), 'Incorrect email address or password.');
  assert.equal(getAuthErrorMessage({ status: 429 }, 'login'), 'Too many attempts. Please wait a few minutes before trying again.');
  assert.equal(getAuthErrorMessage(new TypeError('Failed to fetch'), 'register'), 'We could not reach the authentication service. Check your connection and try again.');
});

test('does not expose unknown provider messages', () => {
  assert.equal(getAuthErrorMessage(new Error('internal provider database detail'), 'register'), 'We could not create your account. Please try again.');
});

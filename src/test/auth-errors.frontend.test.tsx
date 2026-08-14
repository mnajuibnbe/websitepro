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

test('identifies weak/non-compliant passwords instead of the generic link fallback', () => {
  const expected = "Your password doesn't meet the requirements: use at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.";

  const weakPasswordError = Object.assign(
    new Error('Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789'),
    { status: 422, code: 'weak_password' },
  );
  assert.equal(getAuthErrorMessage(weakPasswordError, 'password-update'), expected);
  assert.equal(getAuthErrorMessage(weakPasswordError, 'register'), expected);

  const codeOnlyError = Object.assign(new Error('Weak password'), { status: 422, code: 'weak_password' });
  assert.equal(getAuthErrorMessage(codeOnlyError, 'password-update'), expected);

  const messageOnlyError = new Error('Password should be at least 8 characters.');
  assert.equal(getAuthErrorMessage(messageOnlyError, 'password-update'), expected);
});

test('still treats expired/invalid links as expired, not weak-password', () => {
  assert.equal(
    getAuthErrorMessage(new Error('Token has expired or is invalid'), 'password-update'),
    'This secure link is invalid or has expired. Request a new link to continue.',
  );
});

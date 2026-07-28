import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthContext } from '../contexts/AuthContext';
import { RequireGuest } from '../components/auth/RequireGuest';
import { SessionRecovery } from '../components/auth/SessionRecovery';
import { createTestAuthValue } from './fixtures';
import { renderFrontend } from './renderFrontend';

test('renders guest content only after session verification succeeds', () => {
  const guest = createTestAuthValue('student', { user: null, isAuthenticated: false });
  const markup = renderFrontend(<AuthContext.Provider value={guest}><RequireGuest><h1>Sign in</h1></RequireGuest></AuthContext.Provider>, { route: '/login' });

  assert.match(markup, /<h1>Sign in<\/h1>/);
});

test('shows a recoverable status instead of treating session failures as signed out', () => {
  const failed = createTestAuthValue('student', { user: null, isAuthenticated: false, sessionError: 'Session unavailable' });
  const markup = renderFrontend(<AuthContext.Provider value={failed}><RequireGuest><h1>Sign in</h1></RequireGuest></AuthContext.Provider>, { route: '/login' });

  assert.doesNotMatch(markup, /<h1>Sign in<\/h1>/);
  assert.match(markup, /Unable to verify your session/);
  assert.match(markup, />Try again<\/button>/);
});

test('session recovery exposes one main landmark and an alert', () => {
  const markup = renderFrontend(<SessionRecovery message="Connection unavailable" onRetry={async () => undefined} />);

  assert.equal(markup.match(/<main\b/g)?.length, 1);
  assert.match(markup, /role="alert"/);
  assert.match(markup, /Connection unavailable/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { ContactPage } from '../pages/ContactPage';
import { AuthContext } from '../contexts/AuthContext';
import { renderFrontend } from './renderFrontend';

const guestAuth = {
  user: null,
  session: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  sessionError: null,
  retrySession: async () => undefined,
  refreshSession: async () => undefined,
  login: async () => undefined,
  register: async () => ({ user: null, session: null, requiresEmailConfirmation: true }),
  logout: async () => true,
};

test('Egypt-only contact details (phone, address) stay hidden until the visitor\'s country is resolved', () => {
  // No PricingProvider ancestor -- usePricingContext() falls back to the
  // context's own default (isLoading: true, countryGroup: 'international'),
  // the same fail-safe state a real visitor sees for the instant before the
  // pricing API call resolves. Guards against a flash of Egypt-only details
  // (or worse, permanently hidden ones) leaking to international visitors.
  const markup = renderFrontend(
    <AuthContext.Provider value={guestAuth}><ContactPage /></AuthContext.Provider>,
    { route: '/contact' },
  );

  assert.match(markup, /Email Address/);
  assert.match(markup, /support@tutiba\.com/);
  assert.doesNotMatch(markup, /Phone Support/);
  assert.doesNotMatch(markup, /Cairo, Egypt/);
});

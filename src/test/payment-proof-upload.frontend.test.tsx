import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReactElement } from 'react';
import { PaymentProofUpload } from '../components/checkout/PaymentProofUpload';
import { renderFrontend } from './renderFrontend';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

const studentAuthContext: AuthContextType = {
  user: { id: 'student-1', name: 'Student', email: 'student@example.com', role: 'student', joinedAt: '2026-01-01' },
  session: null,
  token: null,
  isAuthenticated: true,
  isLoading: false,
  sessionError: null,
  retrySession: async () => {},
  refreshSession: async () => {},
  login: async () => {},
  register: async () => ({ user: null, session: null, requiresEmailConfirmation: false }),
  logout: async () => true,
};

function withAuth(children: ReactElement) {
  return <AuthContext.Provider value={studentAuthContext}>{children}</AuthContext.Provider>;
}

test('EGP orders offer all three manual payment methods', () => {
  const markup = renderFrontend(withAuth(<PaymentProofUpload orderId="order-1" currency="EGP" hasPendingSubmission={false} />));
  assert.match(markup, />Bank transfer</);
  assert.match(markup, />InstaPay</);
  assert.match(markup, />Vodafone Cash</);
  assert.match(markup, /accept="image\/jpeg,image\/png,image\/webp"/);
});

test('USD orders only offer bank transfer', () => {
  const markup = renderFrontend(withAuth(<PaymentProofUpload orderId="order-1" currency="USD" hasPendingSubmission={false} />));
  assert.match(markup, />Bank transfer</);
  assert.doesNotMatch(markup, />InstaPay</);
  assert.doesNotMatch(markup, />Vodafone Cash</);
});

test('a pending submission replaces the form with an under-review notice', () => {
  const markup = renderFrontend(withAuth(<PaymentProofUpload orderId="order-1" currency="EGP" hasPendingSubmission />));
  assert.match(markup, /Payment proof submitted/);
  assert.doesNotMatch(markup, /Submit payment proof/);
  assert.doesNotMatch(markup, /type="file"/);
});

test('the submit button starts disabled until a file is selected', () => {
  const markup = renderFrontend(withAuth(<PaymentProofUpload orderId="order-1" currency="EGP" hasPendingSubmission={false} />));
  assert.match(markup, /Submit payment proof/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>/);
});

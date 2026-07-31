import assert from 'node:assert/strict';
import test from 'node:test';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
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

test('renders a consistent course active state and honest navigation actions', () => {
  const markup = renderFrontend(<AuthContext.Provider value={guestAuth}><MarketingNavbar /></AuthContext.Provider>, { route: '/course/example' });

  assert.match(markup, /aria-current="page"[^>]*href="\/courses"/);
  assert.match(markup, />Login<\/a>/);
  assert.doesNotMatch(markup, /aria-label="Search courses"/);
  assert.match(markup, /aria-label="Open navigation menu"/);
  assert.match(markup, /aria-controls="marketing-navigation-drawer"/);
  assert.match(markup, /motion-reduce:transition-none/);
  assert.doesNotMatch(markup, /Course prices|Prices shown in|Course prices shown in/);
});

test('desktop navigation exposes Home and keeps Login in the account action group', () => {
  const markup = renderFrontend(<AuthContext.Provider value={guestAuth}><MarketingNavbar /></AuthContext.Provider>, { route: '/' });
  assert.match(markup, /aria-current="page"[^>]*href="\/"[^>]*>Home<\/a>/);
  assert.match(markup, /lg:justify-end/);
  assert.match(markup, />Login<\/a>/);
});

test('uses a solid header away from the homepage', () => {
  const markup = renderFrontend(<AuthContext.Provider value={guestAuth}><MarketingNavbar /></AuthContext.Provider>, { route: '/about' });

  assert.match(markup, /bg-white\/95/);
  assert.match(markup, /aria-current="page"[^>]*href="\/about"/);
});

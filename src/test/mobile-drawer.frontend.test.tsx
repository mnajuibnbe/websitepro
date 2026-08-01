import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReactElement } from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { Sidebar } from '../components/dashboard/Sidebar';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { AuthContext } from '../contexts/AuthContext';
import { DESKTOP_NAVIGATION_QUERY, lockScroll, shouldCloseDrawerForKey, shouldDismissFromBackdrop } from '../lib/mobileDrawer';
import { createTestAuthValue } from './fixtures';
import { renderFrontend } from './renderFrontend';

const noopSetOpen = () => {};

function renderWithAuth(element: ReactElement, role: 'student' | 'admin' = 'student') {
  return renderFrontend(
    <AuthContext.Provider value={createTestAuthValue(role)}>{element}</AuthContext.Provider>,
    { route: role === 'admin' ? '/admin' : '/dashboard' },
  );
}

test('student drawer exposes scrollable navigation and safe-area account actions', () => {
  const markup = renderWithAuth(<Sidebar isOpen setIsOpen={noopSetOpen} />);

  assert.match(markup, /aria-label="Student navigation drawer"/);
  assert.match(markup, /mobile-drawer-viewport/);
  assert.match(markup, /overflow-y-auto/);
  assert.match(markup, /safe-area-inset-bottom/);
  assert.match(markup, />Sign Out</);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-state="open"/);
  assert.match(markup, /right-0/);
  assert.doesNotMatch(markup, /-translate-x-full/);
});

test('admin drawer exposes its role routes, fixed footer, and open backdrop', () => {
  const markup = renderWithAuth(<AdminSidebar isOpen setIsOpen={noopSetOpen} />, 'admin');

  assert.match(markup, /aria-label="Admin navigation"/);
  assert.match(markup, />Admin overview</);
  assert.match(markup, />Course management</);
  assert.match(markup, />User management</);
  assert.match(markup, /shrink-0 border-t/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /right-0/);
});

test('closed drawers omit their backdrops', () => {
  const studentMarkup = renderWithAuth(<Sidebar isOpen={false} setIsOpen={noopSetOpen} />);
  const adminMarkup = renderWithAuth(<AdminSidebar isOpen={false} setIsOpen={noopSetOpen} />, 'admin');

  assert.doesNotMatch(studentMarkup, /backdrop-blur-sm/);
  assert.doesNotMatch(adminMarkup, /backdrop-blur-sm/);
  assert.match(adminMarkup, /aria-label="Open admin navigation"/);
  assert.match(studentMarkup, /inert=""/);
  assert.match(adminMarkup, /inert=""/);
  assert.match(studentMarkup, /data-state="closed"/);
  assert.match(adminMarkup, /pointer-events-none/);
  assert.match(studentMarkup, /translate-x-full/);
  assert.match(adminMarkup, /translate-x-full/);
});

test('drawer primitives preserve close and scroll restoration contracts', () => {
  assert.equal(DESKTOP_NAVIGATION_QUERY, '(min-width: 1024px)');
  assert.equal(shouldCloseDrawerForKey('Escape'), true);
  assert.equal(shouldCloseDrawerForKey('Enter'), false);
  assert.equal(shouldDismissFromBackdrop(true, true), true);
  assert.equal(shouldDismissFromBackdrop(true, false), false);
  assert.equal(shouldDismissFromBackdrop(false, true), false);

  const target = { style: { overflow: 'auto' } };
  const restoreFirstOwner = lockScroll(target);
  const restoreSecondOwner = lockScroll(target);
  assert.equal(target.style.overflow, 'hidden');
  restoreFirstOwner();
  assert.equal(target.style.overflow, 'hidden');
  restoreFirstOwner();
  assert.equal(target.style.overflow, 'hidden');
  restoreSecondOwner();
  assert.equal(target.style.overflow, 'auto');
});

test('marketing drawer is anchored to the right and uses the portal navigation treatment', () => {
  const markup = renderWithAuth(<MarketingNavbar />);

  assert.match(markup, /aria-label="Navigation menu"/);
  assert.match(markup, /right-0/);
  assert.match(markup, /translate-x-full/);
  assert.match(markup, /w-\[min\(18rem,100vw\)\]/);
  assert.match(markup, /rounded-xl px-4 py-3 font-bold/);
  assert.doesNotMatch(markup, /inset-y-0 left-0 w-full max-w-sm/);
});

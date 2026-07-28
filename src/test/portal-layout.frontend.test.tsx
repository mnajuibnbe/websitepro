import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalLayout } from '../components/layout/PortalLayout';
import { renderFrontend } from './renderFrontend';

test('renders portal navigation, mobile trigger, and a single main landmark', () => {
  const markup = renderFrontend(
    <PortalLayout
      sidebar={<aside aria-label="Test navigation">Navigation</aside>}
      mobileNavigationTrigger={<button type="button">Open navigation</button>}
    >
      <h1>Account</h1>
    </PortalLayout>,
    { route: '/profile' },
  );

  assert.match(markup, /aria-label="Test navigation"/);
  assert.match(markup, />Open navigation</);
  assert.match(markup, /<main id="main-content"/);
  assert.equal(markup.match(/<main\b/g)?.length, 1);
  assert.match(markup, /<h1>Account<\/h1>/);
});

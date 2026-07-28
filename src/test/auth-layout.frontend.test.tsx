import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TutibaBrand } from '../components/layout/TutibaBrand';
import { renderFrontend } from './renderFrontend';
import { AuthField } from '../components/auth/AuthField';

test('renders the authentication shell with brand, main landmark, and account help', () => {
  const markup = renderFrontend(
    <AuthLayout title="Sign in to Tutiba" description="Continue learning.">
      <form><button type="submit">Sign in</button></form>
    </AuthLayout>,
    { route: '/login' },
  );

  assert.equal(markup.match(/<main\b/g)?.length, 1);
  assert.match(markup, /<main[^>]*id="main-content"/);
  assert.match(markup, /min-h-dvh/);
  assert.match(markup, /safe-area-inset-bottom/);
  assert.match(markup, /<h1[^>]*>Sign in to Tutiba<\/h1>/);
  assert.match(markup, /aria-label="Tutiba home"/);
  assert.match(markup, /aria-label="Account help"/);
  assert.match(markup, /href="\/contact"/);
  assert.match(markup, /href="\/privacy"/);
  assert.match(markup, /href="\/terms"/);
});

test('associates authentication field hints and errors without dropping supplied descriptions', () => {
  const markup = renderFrontend(<AuthField id="email" label="Email" hint="Use your account email" error="Email is required" aria-describedby="form-help" />);

  assert.match(markup, /aria-describedby="form-help email-hint email-error"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /id="email-hint"/);
  assert.match(markup, /id="email-error" role="alert"/);
});

test('renders compact and full Tutiba brand variants accessibly', () => {
  const fullMarkup = renderFrontend(<TutibaBrand />);
  const compactMarkup = renderFrontend(<TutibaBrand compact />);

  assert.match(fullMarkup, /Cosmeceutical Education/);
  assert.doesNotMatch(compactMarkup, /Cosmeceutical Education/);
  assert.match(compactMarkup, /aria-label="Tutiba home"/);
});

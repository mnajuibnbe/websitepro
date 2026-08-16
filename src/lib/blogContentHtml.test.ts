import assert from 'node:assert/strict';
import test from 'node:test';
import { blogContentPlainText, isBlogContentEmpty } from './blogContentHtml';

// sanitizeBlogContentHtml (DOMPurify) needs a real DOM and is only exercised in the
// browser, matching this project's existing convention for sanitizeRichText (no Node
// test runner coverage either) — verified manually in the browser QA pass instead.

test('extracts plain text across block boundaries for SEO/length checks', () => {
  const html = '<h2>Title</h2><p>First paragraph.</p><p>Second paragraph.</p>';
  assert.equal(blogContentPlainText(html), 'Title\nFirst paragraph.\nSecond paragraph.');
});

test('treats markup-only content as empty', () => {
  assert.equal(isBlogContentEmpty('<p></p>'), true);
  assert.equal(isBlogContentEmpty('<p>Real text</p>'), false);
  assert.equal(isBlogContentEmpty(null), true);
});

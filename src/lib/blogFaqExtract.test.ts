import assert from 'node:assert/strict';
import test from 'node:test';
import { extractFaqEntries } from './blogFaqExtract';

test('returns an empty array when the article has no FAQ blocks', () => {
  assert.deepEqual(extractFaqEntries('<h2>Section</h2><p>Some text.</p>'), []);
  assert.deepEqual(extractFaqEntries(''), []);
  assert.deepEqual(extractFaqEntries(null), []);
});

test('extracts a single FAQ item', () => {
  const html = '<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">Is this safe?</h4><div class="faq-answer"><p>Yes, when used as directed.</p></div></div></div>';
  assert.deepEqual(extractFaqEntries(html), [{ question: 'Is this safe?', answer: 'Yes, when used as directed.' }]);
});

test('extracts multiple items within one FAQ block, in document order', () => {
  const html = '<div data-block="faq" class="faq-block">'
    + '<div class="faq-item"><h4 class="faq-question">Q1?</h4><div class="faq-answer"><p>A1.</p></div></div>'
    + '<div class="faq-item"><h4 class="faq-question">Q2?</h4><div class="faq-answer"><p>A2.</p></div></div>'
    + '</div>';
  assert.deepEqual(extractFaqEntries(html), [
    { question: 'Q1?', answer: 'A1.' },
    { question: 'Q2?', answer: 'A2.' },
  ]);
});

test('extracts across multiple separate FAQ blocks interspersed with prose', () => {
  const html = '<p>Intro</p>'
    + '<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">Q1?</h4><div class="faq-answer"><p>A1.</p></div></div></div>'
    + '<h2>More section</h2><p>Body text.</p>'
    + '<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">Q2?</h4><div class="faq-answer"><p>A2.</p></div></div></div>';
  assert.deepEqual(extractFaqEntries(html), [
    { question: 'Q1?', answer: 'A1.' },
    { question: 'Q2?', answer: 'A2.' },
  ]);
});

test('skips items with an empty answer (question added but not yet answered)', () => {
  const html = '<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">Unanswered?</h4><div class="faq-answer"><p></p></div></div></div>';
  assert.deepEqual(extractFaqEntries(html), []);
});

test('does not mistake a regular H4 heading for a FAQ question', () => {
  const html = '<h4>Just a regular subheading</h4><p>Body.</p>';
  assert.deepEqual(extractFaqEntries(html), []);
});

test('decodes HTML entities and strips markup from question and answer text', () => {
  const html = '<div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">What&#39;s the dose?</h4><div class="faq-answer"><p>Use &lt;1% &amp; patch test first.</p></div></div></div>';
  assert.deepEqual(extractFaqEntries(html), [{ question: "What's the dose?", answer: 'Use <1% & patch test first.' }]);
});

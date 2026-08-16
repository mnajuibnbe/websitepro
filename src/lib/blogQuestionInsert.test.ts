import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFaqBlockHtml } from './blogQuestionInsert';

test('builds an FAQ block matching FaqExtension\'s parseHTML contract', () => {
  const html = buildFaqBlockHtml('How long until I see results?');
  assert.match(html, /data-block="faq"/);
  assert.match(html, /class="faq-block"/);
  assert.match(html, /<div class="faq-item">/);
  assert.match(html, /<h4 class="faq-question">How long until I see results\?<\/h4>/);
  assert.match(html, /<div class="faq-answer"><p><\/p><\/div>/);
});

test('escapes HTML-significant characters in the question text', () => {
  const html = buildFaqBlockHtml('Is "retinol" safe if <18?');
  assert.match(html, /Is &quot;retinol&quot; safe if &lt;18\?/);
  assert.doesNotMatch(html, /<18/);
});

test('trims surrounding whitespace', () => {
  const html = buildFaqBlockHtml('  Does it sting?  ');
  assert.match(html, /<h4 class="faq-question">Does it sting\?<\/h4>/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { countWords, splitProseBlocks } from './blogProseBlocks';

test('splits ordered top-level prose blocks and skips opaque custom blocks', () => {
  const html = '<h2>Section</h2><p>Some text here.</p><div data-block="faq" class="faq-block"><div class="faq-item"><h4 class="faq-question">Q?</h4><div class="faq-answer"><p>A.</p></div></div></div><p>After the FAQ.</p>';
  const blocks = splitProseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.tag), ['h2', 'p', 'p']);
  assert.equal(blocks[2].text, 'After the FAQ.');
});

test('tracks nested same-tag depth correctly for nested lists', () => {
  const html = '<ul><li>Top<ul><li>Nested</li></ul></li></ul><p>Next</p>';
  const blocks = splitProseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.tag), ['ul', 'p']);
  assert.match(blocks[0].text, /Top/);
  assert.match(blocks[0].text, /Nested/);
});

test('treats a standalone image as its own block', () => {
  const html = '<p>Before</p><img src="https://example.com/a.png" alt="A diagram"><p>After</p>';
  const blocks = splitProseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.tag), ['p', 'img', 'p']);
});

test('skips a table entirely (not a prose block)', () => {
  const html = '<p>Before</p><table><tbody><tr><td>Cell</td></tr></tbody></table><p>After</p>';
  const blocks = splitProseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.tag), ['p', 'p']);
});

test('ignores inline tags for depth tracking', () => {
  const html = '<p>Text with <strong>bold</strong> and <a href="/x">a link</a>.</p><h2>Next</h2>';
  const blocks = splitProseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.tag), ['p', 'h2']);
  assert.equal(blocks[0].text, 'Text with bold and a link.');
});

test('countWords counts whitespace-separated tokens', () => {
  assert.equal(countWords('  one   two three  '), 3);
  assert.equal(countWords(''), 0);
});

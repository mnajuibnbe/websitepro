import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceDomain, validateSource } from './blogSources';

test('rejects a missing name', () => {
  assert.equal(validateSource({ name: '', url: 'https://example.com', accessedDate: '2026-08-16' }), 'Add a source name.');
});

test('rejects a non-http(s) URL', () => {
  assert.equal(validateSource({ name: 'Study', url: 'not-a-url', accessedDate: '2026-08-16' }), 'Enter a full URL starting with https://');
});

test('rejects a missing accessed date', () => {
  assert.equal(validateSource({ name: 'Study', url: 'https://example.com', accessedDate: '' }), 'Add the date you accessed this source.');
});

test('accepts a well-formed source', () => {
  assert.equal(validateSource({ name: 'Study', url: 'https://example.com/paper', accessedDate: '2026-08-16' }), null);
});

test('sourceDomain strips protocol, path, and a leading www', () => {
  assert.equal(sourceDomain('https://www.ncbi.nlm.nih.gov/pmc/articles/123'), 'ncbi.nlm.nih.gov');
  assert.equal(sourceDomain('https://example.com'), 'example.com');
});

test('sourceDomain falls back to the raw string for an unparseable URL', () => {
  assert.equal(sourceDomain('not-a-url'), 'not-a-url');
});

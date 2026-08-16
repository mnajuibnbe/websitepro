import assert from 'node:assert/strict';
import test from 'node:test';
import { findBlogVideoByIndex, splitBlogContentIntoSegments } from './blogContentSegments';

test('splits static HTML around a video block', () => {
  const html = '<p>Before</p><div data-block="video" data-provider="youtube" data-url="https://youtu.be/abc123defgh"></div><p>After</p>';
  const segments = splitBlogContentIntoSegments(html);
  assert.deepEqual(segments, [
    { type: 'html', html: '<p>Before</p>' },
    { type: 'video', index: 0, provider: 'youtube', url: 'https://youtu.be/abc123defgh' },
    { type: 'html', html: '<p>After</p>' },
  ]);
});

test('assigns stable ordinal indexes across multiple video blocks', () => {
  const html = '<div data-block="video" data-provider="youtube" data-url="https://youtu.be/aaaaaaaaaaa"></div><p>Middle</p><div data-block="video" data-provider="google_drive" data-url="https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view"></div>';
  const segments = splitBlogContentIntoSegments(html);
  const videos = segments.filter((s) => s.type === 'video');
  assert.deepEqual(videos.map((v) => v.index), [0, 1]);
  assert.equal(findBlogVideoByIndex(html, 1)?.provider, 'google_drive');
  assert.equal(findBlogVideoByIndex(html, 5), null);
});

test('decodes sanitizer-escaped ampersands in the URL attribute', () => {
  const html = '<div data-block="video" data-provider="youtube" data-url="https://youtube.com/watch?v=abc123defgh&amp;feature=share"></div>';
  assert.equal(findBlogVideoByIndex(html, 0)?.url, 'https://youtube.com/watch?v=abc123defgh&feature=share');
});

test('content with no video blocks is a single html segment', () => {
  const html = '<p>Just text</p>';
  assert.deepEqual(splitBlogContentIntoSegments(html), [{ type: 'html', html }]);
});

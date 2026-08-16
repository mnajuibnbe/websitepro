import assert from 'node:assert/strict';
import test from 'node:test';
import { detectBlogVideoProvider, isGoogleDriveFileUrl, parseYoutubeVideoId } from './videoUrl';

test('recognizes Google Drive file share links without accepting folders or malformed URLs', () => {
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view?usp=drive_link'), true);
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/open?id=abcdefghijklmnopqrstuvwxyz123456'), true);
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/drive/folders/abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(isGoogleDriveFileUrl('https://example.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view'), false);
  assert.equal(isGoogleDriveFileUrl('not a URL'), false);
});

test('parses a YouTube video ID from the common URL shapes', () => {
  assert.equal(parseYoutubeVideoId('https://youtu.be/abcdefghijk'), 'abcdefghijk');
  assert.equal(parseYoutubeVideoId('https://www.youtube.com/watch?v=abcdefghijk&t=30s'), 'abcdefghijk');
  assert.equal(parseYoutubeVideoId('https://www.youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
  assert.equal(parseYoutubeVideoId('https://example.com/watch?v=abcdefghijk'), null);
});

test('auto-detects the blog video provider for the editor insert dialog', () => {
  assert.equal(detectBlogVideoProvider('https://youtu.be/abcdefghijk'), 'youtube');
  assert.equal(detectBlogVideoProvider('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view'), 'google_drive');
  assert.equal(detectBlogVideoProvider('https://vimeo.com/12345678'), null);
  assert.equal(detectBlogVideoProvider(''), null);
});

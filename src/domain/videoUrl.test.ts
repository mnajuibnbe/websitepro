import assert from 'node:assert/strict';
import test from 'node:test';
import { isGoogleDriveFileUrl } from './videoUrl';

test('recognizes Google Drive file share links without accepting folders or malformed URLs', () => {
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view?usp=drive_link'), true);
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/open?id=abcdefghijklmnopqrstuvwxyz123456'), true);
  assert.equal(isGoogleDriveFileUrl('https://drive.google.com/drive/folders/abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(isGoogleDriveFileUrl('https://example.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view'), false);
  assert.equal(isGoogleDriveFileUrl('not a URL'), false);
});

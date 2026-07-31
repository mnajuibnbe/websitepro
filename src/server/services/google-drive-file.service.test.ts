import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGoogleDriveFileId } from './google-drive-file.service.js';

test('parses a Google Drive PDF share URL', () => {
  assert.equal(
    parseGoogleDriveFileId('https://drive.google.com/file/d/1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ/view?usp=drive_link'),
    '1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ',
  );
});

test('rejects folders and non-Google hosts', () => {
  assert.throws(() => parseGoogleDriveFileId('https://drive.google.com/drive/folders/1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ'), /not a Google Drive folder/);
  assert.throws(() => parseGoogleDriveFileId('https://example.com/file/d/1j4KQwaQt_C_NI7HEMsckbDpFAbDZv7GJ/view'), /Google Drive/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVideoSource, resolveVideoMetadata } from './video-metadata.service';

test('normalizes supported video providers and rejects unsafe URLs', () => {
  assert.equal(parseVideoSource('https://youtu.be/dQw4w9WgXcQ').provider, 'youtube');
  assert.equal(parseVideoSource('https://vimeo.com/12345').provider, 'vimeo');
  assert.deepEqual(parseVideoSource('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view').provider, 'google_drive');
  assert.throws(() => parseVideoSource('https://drive.google.com/drive/folders/abcdefghijklmnopqrstuvwxyz123456'), /Google Drive folder/);
  assert.throws(() => parseVideoSource('http://127.0.0.1/video.mp4'), /HTTPS/);
  assert.throws(() => parseVideoSource('https://192.168.1.10/video.mp4'), /Private network/);
});

test('validates Google Drive file type and duration through trusted metadata', async () => {
  const result = await resolveVideoMetadata('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view', { driveMetadataFn: async () => ({ mimeType: 'video/mp4', durationMillis: '125000' }) });
  assert.deepEqual(result, { provider: 'google_drive', durationSeconds: 125, status: 'ready' });
  await assert.rejects(() => resolveVideoMetadata('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view', { driveMetadataFn: async () => ({ mimeType: 'application/pdf', durationMillis: null }) }), /not a supported video/);
});

test('keeps a valid Google Drive link usable when optional metadata cannot be loaded', async () => {
  const result = await resolveVideoMetadata('https://drive.google.com/file/d/abcdefghijklmnopqrstuvwxyz123456/view', {
    driveMetadataFn: async () => { throw new Error('Drive metadata is unavailable'); },
  });
  assert.deepEqual(result, { provider: 'google_drive', durationSeconds: null, status: 'unavailable' });
});

test('extracts Vimeo and HLS durations without trusting the browser', async () => {
  const vimeoFetch = async () => new Response(JSON.stringify({ duration: 125 }), { status: 200 });
  assert.deepEqual(await resolveVideoMetadata('https://vimeo.com/12345', { fetchFn: vimeoFetch as typeof fetch }), { provider: 'vimeo', durationSeconds: 125, status: 'ready' });
  const hlsFetch = async () => new Response('#EXTM3U\n#EXTINF:10.5,\na.ts\n#EXTINF:20,\nb.ts', { status: 200 });
  const lookupFn = async () => [{ address: '203.0.113.10', family: 4 as const }];
  assert.deepEqual(await resolveVideoMetadata('https://cdn.example.com/video.m3u8', { fetchFn: hlsFetch as typeof fetch, lookupFn }), { provider: 'hls', durationSeconds: 31, status: 'ready' });
});

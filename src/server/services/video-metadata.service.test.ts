import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVideoSource, resolveVideoMetadata } from './video-metadata.service';

test('normalizes supported video providers and rejects unsafe URLs', () => {
  assert.equal(parseVideoSource('https://youtu.be/dQw4w9WgXcQ').provider, 'youtube');
  assert.equal(parseVideoSource('https://vimeo.com/12345').provider, 'vimeo');
  assert.throws(() => parseVideoSource('http://127.0.0.1/video.mp4'), /HTTPS/);
  assert.throws(() => parseVideoSource('https://192.168.1.10/video.mp4'), /Private network/);
});

test('extracts Vimeo and HLS durations without trusting the browser', async () => {
  const vimeoFetch = async () => new Response(JSON.stringify({ duration: 125 }), { status: 200 });
  assert.deepEqual(await resolveVideoMetadata('https://vimeo.com/12345', { fetchFn: vimeoFetch as typeof fetch }), { provider: 'vimeo', durationSeconds: 125, status: 'ready' });
  const hlsFetch = async () => new Response('#EXTM3U\n#EXTINF:10.5,\na.ts\n#EXTINF:20,\nb.ts', { status: 200 });
  const lookupFn = async () => [{ address: '203.0.113.10', family: 4 as const }];
  assert.deepEqual(await resolveVideoMetadata('https://cdn.example.com/video.m3u8', { fetchFn: hlsFetch as typeof fetch, lookupFn }), { provider: 'hls', durationSeconds: 31, status: 'ready' });
});

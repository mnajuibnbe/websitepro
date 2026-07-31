import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export type VideoProvider = 'youtube' | 'vimeo' | 'google_drive' | 'hls' | 'mp4';
export interface VideoMetadata { provider: VideoProvider; durationSeconds: number | null; status: 'ready' | 'unavailable'; }

function isPrivateIp(hostname: string): boolean {
  if (!isIP(hostname)) return false;
  return hostname.startsWith('10.') || hostname.startsWith('127.') || hostname.startsWith('169.254.') || hostname.startsWith('192.168.') || hostname.startsWith('0.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80');
}

export function parseVideoSource(input: string): { url: URL; provider: VideoProvider; externalId?: string } {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error('Enter a valid HTTPS video URL.'); }
  if (url.protocol !== 'https:') throw new Error('Video URLs must use HTTPS.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || isPrivateIp(host)) throw new Error('Private network video URLs are not allowed.');
  const youtube = host === 'youtu.be' ? url.pathname.slice(1) : host.endsWith('youtube.com') ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : null;
  if (youtube && /^[\w-]{11}$/.test(youtube)) return { url, provider: 'youtube', externalId: youtube };
  const vimeo = host.endsWith('vimeo.com') ? url.pathname.match(/(?:video\/)?(\d+)/)?.[1] : null;
  if (vimeo) return { url, provider: 'vimeo', externalId: vimeo };
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    if (/\/drive\/folders\//.test(url.pathname) || /\/folders\//.test(url.pathname)) throw new Error('This is a Google Drive folder. Open the video file inside it and paste that file’s share link.');
    const fileId = url.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] || url.searchParams.get('id');
    if (!fileId || !/^[\w-]{20,}$/.test(fileId)) throw new Error('Use a Google Drive video file share link, not a folder or Drive page link.');
    return { url, provider: 'google_drive', externalId: fileId };
  }
  if (/\.m3u8(?:$|\?)/i.test(url.href)) return { url, provider: 'hls' };
  if (/\.mp4(?:$|\?)/i.test(url.href)) return { url, provider: 'mp4' };
  throw new Error('Use a supported YouTube, Vimeo, HLS, or MP4 URL.');
}

export async function resolveVideoMetadata(input: string, options: { fetchFn?: typeof fetch; youtubeApiKey?: string; lookupFn?: (hostname: string) => Promise<Array<{ address: string }>>; driveMetadataFn?: (fileId: string) => Promise<{ mimeType?: string | null; durationMillis?: string | number | null }> } = {}): Promise<VideoMetadata> {
  const source = parseVideoSource(input);
  const fetchFn = options.fetchFn || fetch;
  if (source.provider === 'google_drive') {
    if (!options.driveMetadataFn) return { provider: 'google_drive', durationSeconds: null, status: 'unavailable' };
    let metadata: { mimeType?: string | null; durationMillis?: string | number | null };
    try {
      metadata = await options.driveMetadataFn(source.externalId!);
    } catch {
      // A valid Drive share link can be playable even when the metadata API is
      // temporarily unavailable or cannot read the file. Duration detection is
      // optional, so do not report the URL itself as invalid in that case.
      return { provider: 'google_drive', durationSeconds: null, status: 'unavailable' };
    }
    if (!metadata.mimeType?.startsWith('video/')) throw new Error('The Google Drive file is not a supported video.');
    const durationSeconds = Math.round(Number(metadata.durationMillis || 0) / 1000);
    return { provider: 'google_drive', durationSeconds: durationSeconds > 0 ? durationSeconds : null, status: durationSeconds > 0 ? 'ready' : 'unavailable' };
  }
  if (source.provider === 'hls' || source.provider === 'mp4') {
    const addresses = options.lookupFn ? await options.lookupFn(source.url.hostname) : await lookup(source.url.hostname, { all: true });
    if (addresses.some(address => isPrivateIp(address.address))) throw new Error('Private network video URLs are not allowed.');
  }
  if (source.provider === 'vimeo') {
    const response = await fetchFn(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(source.url.href)}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Vimeo metadata could not be loaded.');
    const payload = await response.json() as { duration?: number };
    return { provider: 'vimeo', durationSeconds: payload.duration && payload.duration > 0 ? Math.round(payload.duration) : null, status: payload.duration ? 'ready' : 'unavailable' };
  }
  if (source.provider === 'youtube') {
    if (!options.youtubeApiKey) return { provider: 'youtube', durationSeconds: null, status: 'unavailable' };
    const response = await fetchFn(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${source.externalId}&key=${encodeURIComponent(options.youtubeApiKey)}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('YouTube metadata could not be loaded.');
    const payload = await response.json() as { items?: Array<{ contentDetails?: { duration?: string } }> };
    const iso = payload.items?.[0]?.contentDetails?.duration;
    if (!iso) return { provider: 'youtube', durationSeconds: null, status: 'unavailable' };
    const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    const seconds = match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
    return { provider: 'youtube', durationSeconds: seconds || null, status: seconds ? 'ready' : 'unavailable' };
  }
  if (source.provider === 'hls') {
    const response = await fetchFn(source.url, { headers: { Accept: 'application/vnd.apple.mpegurl' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('HLS metadata could not be loaded.');
    const manifest = (await response.text()).slice(0, 1_000_000);
    const seconds = [...manifest.matchAll(/#EXTINF:([\d.]+)/g)].reduce((total, match) => total + Number(match[1]), 0);
    return { provider: 'hls', durationSeconds: seconds > 0 ? Math.round(seconds) : null, status: seconds > 0 ? 'ready' : 'unavailable' };
  }
  return { provider: 'mp4', durationSeconds: null, status: 'unavailable' };
}

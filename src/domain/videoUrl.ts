export function isGoogleDriveFileUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || (host !== 'drive.google.com' && host !== 'docs.google.com')) return false;

    const fileId = url.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] || url.searchParams.get('id');
    return Boolean(fileId && /^[\w-]{20,}$/.test(fileId));
  } catch {
    return false;
  }
}

const YOUTUBE_ID_RE = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;

export function parseYoutubeVideoId(input: string): string | null {
  return input.trim().match(YOUTUBE_ID_RE)?.[1] ?? null;
}

export type BlogVideoUrlProvider = 'youtube' | 'google_drive';

/** Used by the blog block editor's video-insert dialog to auto-detect the provider from a pasted URL. */
export function detectBlogVideoProvider(input: string): BlogVideoUrlProvider | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isGoogleDriveFileUrl(trimmed)) return 'google_drive';
  if (parseYoutubeVideoId(trimmed)) return 'youtube';
  return null;
}

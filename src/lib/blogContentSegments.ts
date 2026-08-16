/**
 * Splits sanitized blog content HTML into static-HTML segments and video-block
 * segments. Video is the only block that needs a live React component at render time
 * (a Google Drive embed needs a signed streaming token; YouTube needs an iframe) — every
 * other block (faq/callout/button/table/etc.) is plain semantic HTML and renders as-is.
 *
 * Regex-based rather than DOM-based on purpose: this module is imported by both the
 * browser bundle (BlogContentRenderer) and the Express server (video.controller, to
 * resolve a trusted video URL server-side), so it must not depend on `DOMParser`/`window`.
 * It only needs to recognize the exact, self-closed `data-block="video"` markup this
 * project's own editor produces (see BLOG_CONTENT_ALLOWED_TAGS in blogContentHtml.ts),
 * not arbitrary third-party HTML.
 */

export type BlogVideoProvider = 'youtube' | 'google_drive';

export interface BlogHtmlSegment { type: 'html'; html: string }
export interface BlogVideoSegment { type: 'video'; index: number; provider: BlogVideoProvider; url: string }
export type BlogContentSegment = BlogHtmlSegment | BlogVideoSegment;

const VIDEO_BLOCK_RE = /<div[^>]*data-block="video"[^>]*><\/div>/gi;
const ATTR_ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

function decodeAttr(value: string): string {
  return value.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => ATTR_ENTITIES[match] || match);
}

function readAttr(block: string, name: string): string | null {
  return block.match(new RegExp(`data-${name}="([^"]*)"`))?.[1] ?? null;
}

function isVideoProvider(value: string | null): value is BlogVideoProvider {
  return value === 'youtube' || value === 'google_drive';
}

export function splitBlogContentIntoSegments(html: string): BlogContentSegment[] {
  const segments: BlogContentSegment[] = [];
  let lastIndex = 0;
  let videoIndex = 0;
  let match: RegExpExecArray | null;
  VIDEO_BLOCK_RE.lastIndex = 0;

  while ((match = VIDEO_BLOCK_RE.exec(html))) {
    if (match.index > lastIndex) segments.push({ type: 'html', html: html.slice(lastIndex, match.index) });

    const block = match[0];
    const provider = readAttr(block, 'provider');
    const url = readAttr(block, 'url');
    if (isVideoProvider(provider) && url) {
      segments.push({ type: 'video', index: videoIndex, provider, url: decodeAttr(url) });
    }
    videoIndex += 1;
    lastIndex = match.index + block.length;
  }

  if (lastIndex < html.length) segments.push({ type: 'html', html: html.slice(lastIndex) });
  return segments;
}

/** Server-side lookup: resolve the trusted URL for the Nth video block in a post's stored content, by ordinal position. */
export function findBlogVideoByIndex(html: string, index: number): { provider: BlogVideoProvider; url: string } | null {
  const segment = splitBlogContentIntoSegments(html).find((entry): entry is BlogVideoSegment => entry.type === 'video' && entry.index === index);
  return segment ? { provider: segment.provider, url: segment.url } : null;
}

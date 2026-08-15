import DOMPurify from 'dompurify';

/** The only tags the shared rich text toolbar (Bold, Italic, numbered/bullet list) can produce. */
export const RICH_TEXT_ALLOWED_TAGS = ['p', 'strong', 'em', 'ol', 'ul', 'li'];

const SANITIZE_CONFIG = { ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS, ALLOWED_ATTR: [] };

/** Strips anything outside the allowed tag set. Safe to call on both write and read. */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SANITIZE_CONFIG).trim();
}

const BLOCK_CLOSE_TAGS = /<\/(p|li)>/gi;
const HTML_TAGS = /<[^>]*>/g;
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
};

/**
 * Visible text length of rich text HTML, ignoring markup. Pure string logic (no DOM
 * dependency) so it also runs under the Node test runner, not just the browser.
 */
export function richTextVisibleLength(html: string | null | undefined): number {
  if (!html) return 0;
  const withBreaks = html.replace(BLOCK_CLOSE_TAGS, '\n');
  const withoutTags = withBreaks.replace(HTML_TAGS, '');
  const withoutEntities = withoutTags.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => HTML_ENTITIES[match] || match);
  return withoutEntities.replace(/\s+/g, ' ').trim().length;
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  return richTextVisibleLength(html) === 0;
}

/** Tailwind utilities for rendering sanitized rich text with real list/paragraph typography. */
export const RICH_TEXT_TYPOGRAPHY_CLASS =
  '[&_p]:mb-4 last:[&_p]:mb-0 [&_strong]:font-bold [&_strong]:text-primary-900 [&_em]:italic ' +
  '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 last:[&_ul]:mb-0 ' +
  '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 last:[&_ol]:mb-0 ' +
  '[&_li]:leading-relaxed [&_li>ul]:mt-2 [&_li>ol]:mt-2';

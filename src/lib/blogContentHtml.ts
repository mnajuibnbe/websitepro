import DOMPurify from 'dompurify';

/**
 * Semantic HTML contract produced by `BlogContentEditor` (Tiptap) and rendered on the
 * public blog page. Plain tags (p/h2-h4/lists/blockquote/img/table/a) map straight to
 * Google's documented ranking signals (title/headings/body/alt text). The four custom
 * blocks (video/faq/callout/button) are marked with `data-block` so the public renderer
 * can find them; video additionally gets hydrated into a live player component since a
 * Google Drive embed needs a signed streaming token, not just static markup.
 */
export const BLOG_CONTENT_ALLOWED_TAGS = [
  'p', 'strong', 'em', 'a',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'blockquote',
  'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div',
];

export const BLOG_CONTENT_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class',
  'src', 'alt', 'loading', 'width', 'height',
  'colspan', 'rowspan', 'colwidth',
];

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: BLOG_CONTENT_ALLOWED_TAGS,
  ALLOWED_ATTR: BLOG_CONTENT_ALLOWED_ATTR,
  ALLOW_DATA_ATTR: true,
};

/** Strips anything outside the blog block set. Safe to call on both write and read. */
export function sanitizeBlogContentHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SANITIZE_CONFIG).trim();
}

const BLOCK_CLOSE_TAGS = /<\/(p|li|h2|h3|h4|blockquote|td|th|div)>/gi;
const HTML_TAGS = /<[^>]*>/g;
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
};

/** Visible text of the article body, ignoring markup — used for SEO derivation and soft length hints. */
export function blogContentPlainText(html: string | null | undefined): string {
  if (!html) return '';
  const withBreaks = html.replace(BLOCK_CLOSE_TAGS, '\n');
  const withoutTags = withBreaks.replace(HTML_TAGS, '');
  const withoutEntities = withoutTags.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => HTML_ENTITIES[match] || match);
  return withoutEntities.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

export function isBlogContentEmpty(html: string | null | undefined): boolean {
  return blogContentPlainText(html).length === 0;
}

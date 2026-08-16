/**
 * Splits blog content HTML into an ordered list of top-level prose blocks
 * (h2/h3/h4/p/ul/ol/blockquote/img), used by the SEO sidebar's heading-structure and
 * readability analyzers. The custom, `data-block`-marked divs (video/faq/callout/button
 * — see BLOG_CONTENT_ALLOWED_TAGS in blogContentHtml.ts) are treated as opaque and
 * skipped entirely: they're supplementary UI elements, not the article's written
 * narrative, so they shouldn't count toward paragraph/section length or heading flow.
 * (Total word count for the plain "Word count: N" display should still use
 * `blogContentPlainText`, which does include them — that's a different question: how
 * much is on the page at all, not how the prose itself reads.)
 *
 * Regex/depth-counter based rather than DOM-based, matching this project's existing
 * blogContentSegments.ts convention, so it works in both the browser and the Node test
 * runner. Same-tag-name nesting (e.g. a nested <ul><li><ul>...) is tracked by counting
 * opens/closes of that one tag name — inline tags (strong/em/a/img inside a block) never
 * match the tracked name, so they're naturally ignored without special-casing them.
 */
import { blogContentPlainText } from './blogContentHtml';

export type ProseBlockTag = 'h2' | 'h3' | 'h4' | 'p' | 'ul' | 'ol' | 'blockquote' | 'img';

export interface ProseBlock {
  tag: ProseBlockTag;
  html: string;
  text: string;
  wordCount: number;
}

const TOP_LEVEL_TAGS = new Set<ProseBlockTag>(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'blockquote', 'img']);
const OPAQUE_TAGS = new Set(['div', 'table']);
const VOID_TAGS = new Set<ProseBlockTag>(['img']);
const TAG_TOKEN_RE = /<\/?([a-zA-Z0-9]+)\b[^>]*>/g;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function makeBlock(tag: ProseBlockTag, html: string): ProseBlock {
  const text = blogContentPlainText(html);
  return { tag, html, text, wordCount: countWords(text) };
}

export function splitProseBlocks(html: string): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  let depth = 0;
  let currentTag: string | null = null;
  let start = 0;
  let match: RegExpExecArray | null;
  TAG_TOKEN_RE.lastIndex = 0;

  while ((match = TAG_TOKEN_RE.exec(html))) {
    const isClose = match[0][1] === '/';
    const tagName = match[1].toLowerCase();

    if (depth === 0) {
      if (isClose) continue;
      if (VOID_TAGS.has(tagName as ProseBlockTag)) {
        blocks.push(makeBlock(tagName as ProseBlockTag, match[0]));
        continue;
      }
      if (TOP_LEVEL_TAGS.has(tagName as ProseBlockTag) || OPAQUE_TAGS.has(tagName)) {
        currentTag = tagName;
        start = match.index;
        depth = 1;
      }
      continue;
    }

    if (tagName !== currentTag) continue;
    if (isClose) {
      depth -= 1;
      if (depth === 0) {
        const end = match.index + match[0].length;
        if (TOP_LEVEL_TAGS.has(currentTag as ProseBlockTag)) blocks.push(makeBlock(currentTag as ProseBlockTag, html.slice(start, end)));
        currentTag = null;
      }
    } else {
      depth += 1;
    }
  }

  return blocks;
}

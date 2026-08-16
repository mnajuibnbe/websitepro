import { normalizeTokens } from './blogSeo';
import { splitProseBlocks } from './blogProseBlocks';

/**
 * Internal Linking Assistant: no external API needed. Ranks this site's own published
 * courses/blog posts against the article being edited by simple token overlap (title,
 * target query, secondary queries, and heading text vs. the candidate's own title/
 * summary/category) — the same tokenizer already used by blogSeo.ts's query-mention
 * checks, so "does this read as related" stays consistent across the sidebar.
 */

export interface LinkCandidate {
  kind: 'course' | 'post';
  id: string;
  href: string;
  title: string;
  summary: string | null;
  category: string | null;
}

export interface LinkSuggestion extends LinkCandidate {
  matchedTerms: string[];
  score: number;
  alreadyLinked: boolean;
}

const HREF_RE = /<a\b[^>]*\shref="([^"]*)"[^>]*>/gi;

/** All hrefs found in the article body, in document order (may include duplicates). */
export function extractLinkHrefs(html: string): string[] {
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;
  HREF_RE.lastIndex = 0;
  while ((match = HREF_RE.exec(html))) hrefs.push(match[1]);
  return hrefs;
}

function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export interface InternalLinkCounts { total: number; uniqueHrefs: string[] }

/** Internal (site-relative) links only — used for the "Internal Links" score category. */
export function countInternalLinks(html: string): InternalLinkCounts {
  const hrefs = extractLinkHrefs(html).filter(isInternalHref);
  return { total: hrefs.length, uniqueHrefs: Array.from(new Set(hrefs)) };
}

function headingTokens(contentHtml: string): string[] {
  return splitProseBlocks(contentHtml)
    .filter((block) => block.tag === 'h2' || block.tag === 'h3' || block.tag === 'h4')
    .flatMap((block) => normalizeTokens(block.text));
}

export interface ArticleTopicInput {
  title: string;
  primaryQuery: string | null;
  secondaryQueries: string[];
  contentHtml: string;
}

/**
 * Ranks candidates by shared meaningful words against the article's title, target
 * queries, and heading text. Title words count double (a candidate's own title is the
 * strongest relevance signal). Zero-score candidates are dropped; already-linked
 * candidates are kept (flagged) so the panel can show "Already linked" instead of
 * silently hiding them.
 */
export function suggestInternalLinks(article: ArticleTopicInput, candidates: LinkCandidate[], limit = 6): LinkSuggestion[] {
  const articleTokens = new Set([
    ...normalizeTokens(article.title),
    ...normalizeTokens(article.primaryQuery || ''),
    ...article.secondaryQueries.flatMap(normalizeTokens),
    ...headingTokens(article.contentHtml),
  ]);
  const linkedHrefs = new Set(countInternalLinks(article.contentHtml).uniqueHrefs);

  const scored = candidates.map((candidate) => {
    const candidateTokens = [
      ...normalizeTokens(candidate.title),
      ...normalizeTokens(candidate.title),
      ...normalizeTokens(candidate.summary || ''),
      ...normalizeTokens(candidate.category || ''),
    ];
    const matched = Array.from(new Set(candidateTokens.filter((token) => articleTokens.has(token))));
    return { ...candidate, matchedTerms: matched, score: matched.length, alreadyLinked: linkedHrefs.has(candidate.href) };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

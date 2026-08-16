import { blogContentPlainText } from './blogContentHtml';

/**
 * SEO field derivation for blog posts, following current Google Search Central
 * guidance rather than legacy "SEO score" rules: Google explicitly does not enforce a
 * fixed title/description character limit and may rewrite either in the SERP, so these
 * helpers produce natural-length defaults plus soft, informational hints — never hard
 * truncation or a pass/fail validation gate.
 */

const clean = (value?: string | null) => (value || '').replace(/\s+/g, ' ').trim();

export const SITE_NAME = 'Tutiba';

/** Default SEO title when the admin hasn't set an override. */
export function deriveSeoTitle(title?: string | null): string {
  const cleaned = clean(title);
  return cleaned ? `${cleaned} | ${SITE_NAME} Blog` : `${SITE_NAME} Blog`;
}

/** Default meta description when the admin hasn't set an override: the excerpt, or failing that the article's own opening text. */
export function deriveMetaDescription(excerpt?: string | null, contentHtml?: string | null): string {
  const cleanedExcerpt = clean(excerpt);
  if (cleanedExcerpt) return cleanedExcerpt;
  return clean(blogContentPlainText(contentHtml)).slice(0, 300);
}

export function deriveCanonicalUrl(siteOrigin: string, slug: string): string {
  return `${siteOrigin.replace(/\/+$/, '')}/blog/${slug}`;
}

/**
 * Soft, informational hint only — Google may still rewrite the title, and there is no
 * fixed cutoff. ~60 characters is a common point where SERP truncation *may* start, not
 * a hard rule enforced here.
 */
export function seoTitleHint(title: string): string | null {
  if (title.length === 0) return null;
  if (title.length > 60) return `${title.length} characters — search results may truncate longer titles, though Google often rewrites titles regardless of length.`;
  return null;
}

/** Same caveat as `seoTitleHint`: informational only, not a validation rule. */
export function metaDescriptionHint(description: string): string | null {
  if (description.length === 0) return 'No description yet — search engines will generate one from the page automatically.';
  if (description.length > 160) return `${description.length} characters — search results may truncate longer descriptions, though Google often shows a different snippet regardless.`;
  return null;
}

export const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'for', 'of', 'to', 'in', 'on', 'with', 'is', 'are', 'how', 'what', 'why']);

export function normalizeTokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token && !STOPWORDS.has(token));
}

/** Loose match: an exact phrase hit, or most of the query's meaningful words present. Informational only. */
export function textLikelyMentionsQuery(text: string, query?: string | null): boolean | null {
  const trimmedQuery = (query || '').trim();
  if (!trimmedQuery) return null;
  const normalizedText = (text || '').toLowerCase();
  if (normalizedText.includes(trimmedQuery.toLowerCase())) return true;
  const queryTokens = normalizeTokens(trimmedQuery);
  if (queryTokens.length === 0) return null;
  const textTokens = new Set(normalizeTokens(text || ''));
  const matched = queryTokens.filter((token) => textTokens.has(token));
  return matched.length / queryTokens.length >= 0.6;
}

const GENERIC_TITLES = new Set(['untitled', 'new post', 'blog post', 'draft', 'article', 'my post', 'post', `${SITE_NAME.toLowerCase()} blog`]);

/**
 * Flags titles that don't say anything specific — informational nudge, not a rule.
 * A short/generic title isn't wrong (Google has no minimum), it's just a missed chance
 * to tell both readers and search engines what the article actually covers.
 */
export function genericTitleHint(title: string): string | null {
  const cleaned = clean(title).toLowerCase().replace(/\s*\|\s*.+$/, '');
  if (!cleaned) return null;
  if (GENERIC_TITLES.has(cleaned)) return 'This title is generic — consider naming the specific topic so readers and search engines know what the article covers.';
  const meaningfulWords = normalizeTokens(cleaned);
  if (meaningfulWords.length <= 1) return 'This title is very short — consider making it more descriptive of the article\'s specific topic.';
  return null;
}

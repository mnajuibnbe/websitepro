import { blogContentPlainText } from './blogContentHtml';

/**
 * Duplicate/Similar Content Checker (Phase 4): flags when the article being edited
 * reads as a near-duplicate of another post already on this site, so the admin can
 * update the existing article instead of publishing a redundant one.
 *
 * Deliberately local/deterministic rather than a Gemini call like Topic Coverage
 * (gemini.service.ts): "is this a rewrite of that other article" is a mechanical
 * text-overlap question, not one needing topical judgment, and unlike Topic Coverage's
 * explicit "Analyze" button this needs to reflect the *current* draft on every edit
 * against *every other post* — re-running a billed API call per post per keystroke
 * would be slow, costly, and would silently stop working if the AI service is
 * unavailable. A word-shingle Jaccard similarity (5-word n-grams) is the standard
 * cheap technique for near-duplicate text detection: it requires overlapping runs of
 * consecutive words, not just shared vocabulary, so two distinct articles that happen
 * to share topic terminology (e.g. two different retinol articles) score low, while a
 * copy-pasted-and-lightly-edited article scores high.
 */

export interface DuplicateContentCandidate { id: number; title: string; contentHtml: string }
export interface SimilarPostMatch { id: number; title: string; similarityPercent: number }

const SHINGLE_SIZE = 5;

/** Heuristic cutoff — chosen so a lightly-reworded duplicate (shared structure/sentences) clears it, while two distinct articles on the same broad topic don't. */
export const DUPLICATE_SIMILARITY_THRESHOLD_PERCENT = 30;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function shingles(text: string, size = SHINGLE_SIZE): Set<string> {
  const tokens = tokenize(text);
  if (tokens.length === 0) return new Set();
  if (tokens.length < size) return new Set([tokens.join(' ')]);
  const result = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i += 1) result.add(tokens.slice(i, i + size).join(' '));
  return result;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const shingle of a) if (b.has(shingle)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Compares `currentContentHtml` against every other post, returning near-duplicates
 * above `threshold`, highest similarity first. `currentId` (null for a not-yet-saved
 * new post) excludes the article being edited from its own candidate list.
 */
export function findSimilarPosts(
  currentContentHtml: string,
  currentId: number | null,
  otherPosts: DuplicateContentCandidate[],
  threshold = DUPLICATE_SIMILARITY_THRESHOLD_PERCENT,
): SimilarPostMatch[] {
  const currentShingles = shingles(blogContentPlainText(currentContentHtml));
  if (currentShingles.size === 0) return [];

  return otherPosts
    .filter((post) => post.id !== currentId)
    .map((post) => ({
      id: post.id,
      title: post.title,
      similarityPercent: Math.round(jaccardSimilarity(currentShingles, shingles(blogContentPlainText(post.contentHtml))) * 100),
    }))
    .filter((match) => match.similarityPercent >= threshold)
    .sort((a, b) => b.similarityPercent - a.similarityPercent);
}

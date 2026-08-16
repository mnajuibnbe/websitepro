import type { BlogSource } from '../services/blogPosts.service';

/**
 * Sources/Citations: a structured list kept separate from the free-form article HTML
 * (unlike internal links, which are spliced into the content) so each entry stays
 * individually editable and removable from the sidebar, and so the public page can
 * render a consistent "Sources" section regardless of where in the article it was added.
 */

export function validateSource(draft: BlogSource): string | null {
  if (!draft.name.trim()) return 'Add a source name.';
  if (!/^https?:\/\/.+/i.test(draft.url.trim())) return 'Enter a full URL starting with https://';
  if (!draft.accessedDate.trim()) return 'Add the date you accessed this source.';
  return null;
}

/** Display-only host for a citation link, e.g. "https://www.ncbi.nlm.nih.gov/x" -> "ncbi.nlm.nih.gov". */
export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

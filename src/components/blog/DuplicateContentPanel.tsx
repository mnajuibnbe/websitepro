import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { findSimilarPosts } from '../../lib/blogDuplicateContent';
import type { BlogPost } from '../../services/blogPosts.service';

interface DuplicateContentPanelProps {
  currentId: number | null;
  contentHtml: string;
  posts: BlogPost[];
}

/** No external API — compares against this site's own other posts only (see blogDuplicateContent.ts for why a local similarity check, not Gemini, is used here). */
export function DuplicateContentPanel({ currentId, contentHtml, posts }: DuplicateContentPanelProps) {
  const candidates = useMemo(() => posts.map((post) => ({ id: post.id, title: post.title, contentHtml: post.content })), [posts]);
  const matches = useMemo(() => findSimilarPosts(contentHtml, currentId, candidates), [contentHtml, currentId, candidates]);

  if (matches.length === 0) {
    return <p className="flex items-start gap-2 text-sm text-primary-700"><CheckCircle2 className="h-4 w-4 flex-none text-success-600" />No highly similar existing articles found.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="flex items-start gap-2 text-sm text-primary-700">
        <AlertTriangle className="h-4 w-4 flex-none text-warning-600" />
        This reads similar to {matches.length === 1 ? 'an existing article' : `${matches.length} existing articles`} — consider updating the existing one instead of publishing a near-duplicate.
      </p>
      <ul className="space-y-1.5">
        {matches.map((match) => (
          <li key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-warning-200 bg-warning-50 p-2.5 text-sm text-primary-800">
            <span className="truncate">{match.title}</span>
            <span className="flex-none text-xs font-bold text-warning-700">{match.similarityPercent}% similar</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

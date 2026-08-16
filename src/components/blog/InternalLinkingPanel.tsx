import { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { suggestInternalLinks, type LinkCandidate, type LinkSuggestion } from '../../lib/blogInternalLinks';

interface InternalLinkingPanelProps {
  postId: number | null;
  title: string;
  primaryQuery: string;
  secondaryQueries: string[];
  contentHtml: string;
  onInsertContent: (html: string) => void;
}

interface CourseRow { id: string; title: string; short_description: string | null; category: string | null }
interface PostRow { id: number; slug: string; title: string; excerpt: string | null; category: string | null }

function useLinkCandidates(postId: number | null) {
  const [candidates, setCandidates] = useState<LinkCandidate[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from('courses').select('id, title, short_description, category').eq('status', 'published').or('visibility.eq.public,visibility.is.null'),
      supabase.from('blog_posts').select('id, slug, title, excerpt, category').eq('status', 'published'),
    ]).then(([courses, posts]) => {
      if (!active) return;
      const courseCandidates: LinkCandidate[] = ((courses.data || []) as CourseRow[]).map((c) => ({ kind: 'course', id: c.id, href: `/course/${c.id}`, title: c.title, summary: c.short_description, category: c.category }));
      const postCandidates: LinkCandidate[] = ((posts.data || []) as PostRow[]).filter((p) => p.id !== postId).map((p) => ({ kind: 'post', id: String(p.id), href: `/blog/${p.slug}`, title: p.title, summary: p.excerpt, category: p.category }));
      setCandidates([...courseCandidates, ...postCandidates]);
    }).catch(() => { if (active) setCandidates([]); });
    return () => { active = false; };
  }, [postId]);

  return candidates;
}

/**
 * No external API needed — ranks this site's own published courses/blog posts against
 * the article by title/topic overlap (see blogInternalLinks.ts) and lets the admin
 * insert a link with one click. Insertion appends a plain paragraph link to the article
 * body via `onInsertContent`, the same append-and-resanitize seam BlogContentEditor
 * already syncs from on every render.
 */
export function InternalLinkingPanel({ postId, title, primaryQuery, secondaryQueries, contentHtml, onInsertContent }: InternalLinkingPanelProps) {
  const candidates = useLinkCandidates(postId);
  const suggestions = useMemo(
    () => (candidates ? suggestInternalLinks({ title, primaryQuery, secondaryQueries, contentHtml }, candidates) : []),
    [candidates, title, primaryQuery, secondaryQueries, contentHtml],
  );

  const insert = (suggestion: LinkSuggestion) => {
    onInsertContent(`<p>Related: <a href="${suggestion.href}">${suggestion.title}</a></p>`);
  };

  if (candidates === null) {
    return <p className="flex items-center gap-2 text-sm text-primary-500"><Loader2 className="h-4 w-4 animate-spin" />Loading suggestions…</p>;
  }

  if (!title.trim() && !primaryQuery.trim()) {
    return <p className="text-sm text-primary-500">Add a title or target query to see related courses and articles.</p>;
  }

  if (suggestions.length === 0) {
    return <p className="text-sm text-primary-500">No obviously related published courses or articles yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => (
        <li key={`${s.kind}-${s.id}`} className="rounded-lg border border-primary-100 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary-900">{s.title}</p>
              <p className="truncate text-xs text-primary-500">{s.kind === 'course' ? 'Course' : 'Blog post'}{s.matchedTerms.length > 0 ? ` · matches: ${s.matchedTerms.slice(0, 3).join(', ')}` : ''}</p>
            </div>
            {s.alreadyLinked
              ? <span className="flex-none text-xs font-bold text-success-600">Linked</span>
              : <button type="button" onClick={() => insert(s)} className="flex min-h-9 flex-none items-center gap-1 rounded-lg border border-accent-200 px-2.5 text-xs font-bold text-accent-700 hover:bg-accent-50"><Link2 className="h-3.5 w-3.5" />Insert</button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

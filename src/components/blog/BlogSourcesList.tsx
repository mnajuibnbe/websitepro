import { ExternalLink } from 'lucide-react';
import type { BlogSource } from '../../services/blogPosts.service';
import { sourceDomain } from '../../lib/blogSources';

interface BlogSourcesListProps {
  sources: BlogSource[];
}

/** Renders the article's cited sources as a proper citation list — nofollow, since these are external references, not editorial endorsements. */
export function BlogSourcesList({ sources }: BlogSourcesListProps) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-10 border-t border-primary-100 pt-8" aria-labelledby="blog-sources-heading">
      <h2 id="blog-sources-heading" className="text-lg font-bold text-primary-900">Sources</h2>
      <ol className="mt-4 space-y-2">
        {sources.map((source, index) => (
          <li key={`${source.url}-${index}`} className="flex items-start gap-2 text-sm text-primary-600">
            <span className="flex-none font-bold text-primary-400">{index + 1}.</span>
            <span>
              <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-medium text-accent-700 hover:underline">{source.name}<ExternalLink className="h-3.5 w-3.5" /></a>
              <span className="text-primary-400"> — {sourceDomain(source.url)}, accessed {source.accessedDate}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

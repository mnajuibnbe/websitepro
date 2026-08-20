import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { fetchBlogPostPerformance, SearchConsoleUnavailableError, type SearchConsolePerformance } from '../../services/searchConsole.service';

interface GooglePerformancePanelProps {
  postId: number | null;
  slug: string;
}

type Status = 'idle' | 'loading' | 'success' | 'unavailable' | 'error';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number): string {
  return value > 0 ? value.toFixed(1) : '—';
}

// The Slug field (AdminBlogPosts.tsx) stays editable for an already-saved post, updating
// `slug` on every keystroke -- without debouncing, each keystroke would fire a fresh live
// Search Console request (and a fresh cache-missing pageUrl server-side) until the admin
// stops typing.
const SLUG_CHANGE_DEBOUNCE_MS = 800;

/**
 * Live Search Console data for this exact post URL (Phase 5) -- auto-loads on mount since
 * it's a cheap, server-cached read, unlike the Gemini-backed panels elsewhere in this
 * sidebar which require an explicit "Analyze" click. Gated on `postId` (not just `slug`):
 * a brand-new, never-saved post already has a non-empty `slug` the moment the admin types
 * a title (SeoSidebar auto-fills it), but that draft has no real, indexed page yet -- only
 * a saved post (postId !== null) can have anything for Search Console to report.
 */
export function GooglePerformancePanel({ postId, slug }: GooglePerformancePanelProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [performance, setPerformance] = useState<SearchConsolePerformance | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (postId === null || !slug) { setStatus('idle'); setPerformance(null); return; }
    let active = true;
    const timer = setTimeout(() => {
      setStatus('loading');
      setErrorMessage('');
      fetchBlogPostPerformance(slug)
        .then((result) => { if (active) { setPerformance(result); setStatus('success'); } })
        .catch((err) => {
          if (!active) return;
          setStatus(err instanceof SearchConsoleUnavailableError ? 'unavailable' : 'error');
          setErrorMessage(err instanceof Error ? err.message : 'Could not load Search Console data.');
        });
    }, SLUG_CHANGE_DEBOUNCE_MS);
    return () => { active = false; clearTimeout(timer); };
  }, [postId, slug]);

  if (postId === null || !slug) {
    return <p className="text-sm text-primary-500">Save this post to see its live Google Search Console performance.</p>;
  }
  if (status === 'idle' || status === 'loading') {
    return <p className="flex items-center gap-2 text-sm text-primary-500"><Loader2 className="h-4 w-4 animate-spin" />Loading Search Console data…</p>;
  }
  if (status === 'unavailable') {
    return <p className="flex items-start gap-2 text-sm text-primary-600"><AlertTriangle className="h-4 w-4 flex-none text-warning-600" />{errorMessage}</p>;
  }
  if (status === 'error') {
    return <p role="alert" className="flex items-start gap-2 text-sm text-danger-700"><AlertTriangle className="h-4 w-4 flex-none" />{errorMessage}</p>;
  }
  if (!performance) return null;

  const hasData = performance.clicks > 0 || performance.impressions > 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-primary-500">Last 28 days ({performance.rangeStart} to {performance.rangeEnd}), from Google Search Console.</p>
      {!hasData ? (
        <p className="flex items-start gap-2 text-sm text-primary-600"><Search className="h-4 w-4 flex-none text-primary-400" />No impressions yet in this window — normal for a new or not-yet-indexed post.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-primary-100 p-2.5">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Clicks</p>
              <p className="text-xl font-bold text-primary-900">{performance.clicks.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-primary-100 p-2.5">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Impressions</p>
              <p className="text-xl font-bold text-primary-900">{performance.impressions.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-primary-100 p-2.5">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">CTR</p>
              <p className="text-xl font-bold text-primary-900">{formatPercent(performance.ctr)}</p>
            </div>
            <div className="rounded-lg border border-primary-100 p-2.5">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Avg. position</p>
              <p className="text-xl font-bold text-primary-900">{formatPosition(performance.position)}</p>
            </div>
          </div>
          {performance.topQueries.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Top queries</h4>
              <ul className="mt-2 space-y-1.5">
                {performance.topQueries.map((row) => (
                  <li key={row.query} className="flex items-center justify-between gap-2 rounded-lg border border-primary-100 p-2 text-sm text-primary-700">
                    <span className="truncate">{row.query}</span>
                    <span className="flex-none whitespace-nowrap text-xs text-primary-500">{row.clicks} clicks · {row.impressions} impr.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { fetchCoursePerformance, SearchConsoleUnavailableError, type SearchConsolePerformance } from '../../../services/searchConsole.service';

interface CoursePerformancePanelProps {
  courseId: string;
}

type Status = 'idle' | 'loading' | 'success' | 'unavailable' | 'error';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number): string {
  return value > 0 ? value.toFixed(1) : '—';
}

/** Course-page counterpart to GooglePerformancePanel (blog editor sidebar) -- same live Search Console read, same server route, keyed by course id instead of slug since course URLs are /course/{id}. */
export function CoursePerformancePanel({ courseId }: CoursePerformancePanelProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [performance, setPerformance] = useState<SearchConsolePerformance | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!courseId) { setStatus('idle'); setPerformance(null); return; }
    let active = true;
    setStatus('loading');
    setErrorMessage('');
    fetchCoursePerformance(courseId)
      .then((result) => { if (active) { setPerformance(result); setStatus('success'); } })
      .catch((err) => {
        if (!active) return;
        setStatus(err instanceof SearchConsoleUnavailableError ? 'unavailable' : 'error');
        setErrorMessage(err instanceof Error ? err.message : 'Could not load Search Console data.');
      });
    return () => { active = false; };
  }, [courseId]);

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
        <p className="flex items-start gap-2 text-sm text-primary-600"><Search className="h-4 w-4 flex-none text-primary-400" />No impressions yet in this window — normal for a new or not-yet-indexed course page.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Clicks</p>
              <p className="text-xl font-bold text-primary-900">{performance.clicks.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Impressions</p>
              <p className="text-xl font-bold text-primary-900">{performance.impressions.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">CTR</p>
              <p className="text-xl font-bold text-primary-900">{formatPercent(performance.ctr)}</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-primary-400">Avg. position</p>
              <p className="text-xl font-bold text-primary-900">{formatPosition(performance.position)}</p>
            </div>
          </div>
          {performance.topQueries.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Top queries</h4>
              <ul className="mt-2 grid gap-1.5 md:grid-cols-2">
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

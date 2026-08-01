import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { supabase } from '../../lib/supabase';
import { PageContainer } from '../../components/layout/PageContainer';

interface Row { course_id: string; title: string; author_name: string | null; submitted_at: string; assignee_id: string | null; assignee_name: string | null; due_at: string | null; open_findings: number }

export function AdminCourseReviews() {
  const [sidebar, setSidebar] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setMessage('');
    const { data, error } = await supabase.rpc('admin_list_course_reviews', { p_query: query.trim(), p_limit: 50, p_cursor: null });
    setRows((data || []) as Row[]);
    if (error) { setLoadError(true); setMessage(`The review queue could not be loaded (reference ${error.code || 'unknown'}).`); }
    setLoading(false);
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  return <div className="min-h-screen bg-primary-50">
    <AdminSidebar isOpen={sidebar} setIsOpen={setSidebar} />
    <main id="main-content" className="pb-20 pt-20 lg:pl-72 lg:pt-8"><PageContainer><div className="mx-auto max-w-5xl">
      <header className="mb-7"><p className="font-bold text-amber-700">Quality governance</p><h1 className="text-3xl font-bold">Submitted course reviews</h1><p className="mt-2 text-primary-600">Open a submitted revision, claim it, inspect the immutable snapshot and readiness checks, then record a decision. Approval publishes the approved revision automatically.</p></header>
      <form onSubmit={event => { event.preventDefault(); void load(); }} className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="review-search">Search review queue</label><input id="review-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search courses or instructors" className="min-h-11 flex-1 rounded-xl border bg-white px-4"/><button className="min-h-11 rounded-xl bg-primary-900 px-5 font-bold text-white">Search</button></form>
      {message && <p role={loadError ? 'alert' : 'status'} className="mb-4 rounded-xl border bg-white p-3">{message}</p>}
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-10"><Loader2 className="h-8 w-8 animate-spin" />Loading submitted reviews…</div> : loadError ? <div role="alert" className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center"><p className="font-bold text-danger-800">Review queue unavailable</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white"><RefreshCw className="h-4 w-4" />Try again</button></div> : rows.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><p className="font-bold">No submitted courses are waiting for review.</p><p className="mt-2 text-sm text-primary-500">Draft courses remain with their instructor until they select Submit for review.</p></div> : <div className="space-y-4">{rows.map(row => <article key={row.course_id} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">{row.title}</h2><p className="text-sm text-primary-500">{row.author_name || 'Instructor'} · Submitted {new Date(row.submitted_at).toLocaleString()}</p><p className="mt-2 text-xs font-bold text-primary-600">{row.assignee_name ? `Assigned to ${row.assignee_name}` : 'Unassigned'} · {row.open_findings} open finding{row.open_findings === 1 ? '' : 's'}{row.due_at ? ` · Due ${new Date(row.due_at).toLocaleDateString()}` : ''}</p></div><Link to={`/admin/course-reviews/${row.course_id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 font-bold text-white">Open review workspace <ExternalLink className="h-4 w-4" /></Link></div>
      </article>)}</div>}
    </div></PageContainer></main>
  </div>;
}

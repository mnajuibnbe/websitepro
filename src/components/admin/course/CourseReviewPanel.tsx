import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { type CourseReadiness, type CourseReadinessTarget, readinessTargetHref } from '../../../domain/courseReadiness';

const targetByCheck: Record<string, CourseReadinessTarget> = {
  title: 'details', slug: 'details', summary: 'details', description: 'details', taxonomy: 'details', cover: 'details', instructor: 'details',
  pricing: 'pricing', sections: 'curriculum', lessons: 'curriculum', relationships: 'curriculum', ordering: 'curriculum', content: 'curriculum', quizzes: 'curriculum',
};

function actionAllowed(data: CourseReadiness, action: string, fallback: boolean) {
  return data.allowed_actions?.[action]?.allowed ?? fallback;
}

export function CourseReviewPanel({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState<CourseReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');

  const load = useCallback(async (preserveMessage = false) => {
    setLoading(true);
    if (!preserveMessage) setMessage('');
    const { data: readiness, error } = await supabase.rpc('get_course_readiness', { p_course_id: courseId });
    setData((readiness || null) as CourseReadiness | null);
    if (error) {
      setMessageTone('error');
      setMessage('Readiness checks could not be loaded. Try again before submitting.');
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { void load(); }, [load]);

  const runAction = async (rpc: string, args: Record<string, unknown>, success: string) => {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc(rpc, args);
      if (error) {
        setMessageTone('error');
        setMessage(error.message);
        return;
      }
      setMessageTone('success');
      setMessage(success);
      await load(true);
    } catch {
      setMessageTone('error');
      setMessage('The review action could not be completed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p role="status" className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Checking course readiness…</p>;
  if (!data) return <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4"><p>{message}</p><button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-danger-300 px-4 font-bold"><RefreshCw className="h-4 w-4" />Retry</button></div>;

  const incompleteCount = data.checks.filter((check) => !check.complete).length;
  const canSubmit = actionAllowed(data, 'submit', !isAdmin && data.status === 'draft' && data.authoring_status === 'draft' && data.ready);
  const canFinalize = actionAllowed(data, 'finalize', isAdmin && data.status === 'draft' && data.authoring_status === 'draft' && data.ready);

  return <div className="space-y-5">
    <div><h2 className="text-xl font-bold">Final step: submit your course</h2><p className="mt-1 text-sm text-primary-600">Complete every requirement, then submit an immutable revision. Admin approval publishes the approved revision automatically.</p></div>
    {data.status === 'archived' && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold">This course is archived</p><p className="mt-1 text-sm text-primary-700">Restore it to draft from Course details before trying to submit it for review.</p><Link to={`/admin/courses/${courseId}/edit`} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-amber-300 px-4 font-bold">Open course details</Link></div>}
    {data.reviewer_notes && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold">Reviewer feedback</p><p className="mt-1 whitespace-pre-wrap text-sm">{data.reviewer_notes}</p></div>}
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-primary-700">{incompleteCount === 0 ? 'All requirements are complete.' : `${incompleteCount} requirement${incompleteCount === 1 ? '' : 's'} need attention.`}</p><button type="button" disabled={busy} onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-primary-700 hover:bg-primary-50 disabled:opacity-40"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    <div className="grid gap-3 sm:grid-cols-2">{data.checks.map((check) => {
      const target = check.target || targetByCheck[check.key] || 'curriculum';
      return <div key={check.key} className={`min-h-14 rounded-xl border p-4 ${check.complete ? 'border-success-200 bg-success-100' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">{check.complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-700" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />}<div className="min-w-0 flex-1"><p className="font-bold">{check.label}</p>{!check.complete && check.detail && <p className="mt-1 text-sm text-primary-700">{check.detail}</p>}{!check.complete && check.items?.map((item) => <div key={item.id || item.label} className="mt-2 rounded-lg border border-amber-200 bg-white/60 p-2 text-xs text-primary-700"><p><span className="font-bold">{item.label}</span>{item.detail ? ` — ${item.detail}` : ''}</p>{item.id && <Link to={`/admin/courses/${courseId}/lessons/${item.id}/edit?tab=content`} className="mt-1 inline-flex min-h-11 items-center gap-1 font-bold text-amber-800 underline underline-offset-4">Open lesson<ExternalLink className="h-3.5 w-3.5" /></Link>}</div>)}{!check.complete && <Link to={readinessTargetHref(courseId, target)} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-amber-800 underline underline-offset-4">Resolve this requirement<ExternalLink className="h-3.5 w-3.5" /></Link>}</div></div>
      </div>;
    })}</div>
    {message && <p role={messageTone === 'error' ? 'alert' : 'status'} aria-live="polite" className={`rounded-xl border p-3 text-sm font-semibold ${messageTone === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : messageTone === 'success' ? 'border-success-200 bg-success-100 text-success-800' : 'border-primary-200 bg-primary-50 text-primary-800'}`}>{message}</p>}
    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center"><span className="rounded-full bg-primary-100 px-4 py-2 text-center text-sm font-bold">Review: {data.review_status.replaceAll('_', ' ')}</span>
      {!isAdmin && data.authoring_status === 'draft' && data.status === 'draft' && <button type="button" disabled={!canSubmit || busy} aria-describedby={!canSubmit ? 'submit-disabled-reason' : undefined} onClick={() => void runAction('submit_course_for_review', { p_course_id: courseId, p_notes: '' }, 'Course submitted. Editing is locked while an administrator reviews it.')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Submitting…' : 'Submit for review'}</button>}
      {isAdmin && data.authoring_status === 'draft' && data.status === 'draft' && <button type="button" disabled={!canFinalize || busy} aria-describedby={!canFinalize ? 'submit-disabled-reason' : undefined} onClick={() => void runAction('admin_finalize_course_for_review', { p_course_id: courseId, p_notes: 'Finalized in the course builder' }, 'Course finalized and submitted for review.')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Finalizing…' : 'Finalize for review'}</button>}
      {isAdmin && data.review_status === 'submitted' && <Link to={`/admin/course-reviews/${courseId}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-900 px-5 font-bold text-white">Open review workspace</Link>}
      {isAdmin && data.review_status === 'approved' && data.status === 'published' && <button type="button" disabled={busy} onClick={() => void runAction('admin_set_course_publication', { p_course_id: courseId, p_publish: false }, 'Course unpublished.')} className="min-h-11 rounded-xl border border-primary-200 px-5 font-bold text-primary-800">Unpublish course</button>}
    </div>
    {!data.ready && data.status === 'draft' && <p id="submit-disabled-reason" className="text-sm text-primary-600">Submission stays disabled until every requirement above is complete. Use the Resolve links, save your changes, then refresh these checks.</p>}
  </div>;
}

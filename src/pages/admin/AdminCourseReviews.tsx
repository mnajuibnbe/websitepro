import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { supabase } from '../../lib/supabase';

interface Row { course_id: string; title: string; author_name: string | null; submitted_at: string }
type ReviewDecision = 'approved' | 'changes_requested' | 'rejected';

const decisionLabels: Record<ReviewDecision, string> = {
  approved: 'Approve course',
  changes_requested: 'Request changes',
  rejected: 'Reject course',
};

export function AdminCourseReviews() {
  const [sidebar, setSidebar] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ row: Row; decision: ReviewDecision } | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_course_reviews');
    setRows((data || []) as Row[]);
    if (error) setMessage('The review queue could not be loaded.');
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async () => {
    if (!pending) return;
    const reviewNote = (notes[pending.row.course_id] || '').trim();
    if (reviewNote.length < 5) {
      setMessage('Add a review note of at least 5 characters before making a decision.');
      setPending(null);
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('admin_decide_course_review', {
      p_course_id: pending.row.course_id,
      p_decision: pending.decision,
      p_notes: reviewNote,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(`${pending.row.title} was ${pending.decision.replace('_', ' ')}. The instructor can see your note.`);
    setNotes(current => { const next = { ...current }; delete next[pending.row.course_id]; return next; });
    setPending(null);
    await load();
  };

  const beginDecision = (row: Row, decision: ReviewDecision) => {
    if ((notes[row.course_id] || '').trim().length < 5) {
      setMessage('Add a review note of at least 5 characters before making a decision.');
      return;
    }
    setMessage('');
    setPending({ row, decision });
  };

  return <div className="min-h-screen bg-primary-50">
    <AdminSidebar isOpen={sidebar} setIsOpen={setSidebar} />
    <main className="px-4 pb-20 pt-20 lg:pl-72 lg:pt-8"><div className="mx-auto max-w-5xl">
      <header className="mb-7"><p className="font-bold text-amber-700">Quality governance</p><h1 className="text-3xl font-bold">Submitted course reviews</h1><p className="mt-2 text-primary-600">Instructors submit finished courses here. Inspect each course, write a reason, then approve it, request changes, or reject it. Approval does not publish automatically.</p></header>
      {message && <p role="status" className="mb-4 rounded-xl border bg-white p-3">{message}</p>}
      {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : rows.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><p className="font-bold">No submitted courses are waiting for review.</p><p className="mt-2 text-sm text-primary-500">Draft courses remain with their instructor until they select Submit for review.</p></div> : <div className="space-y-4">{rows.map(row => <article key={row.course_id} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">{row.title}</h2><p className="text-sm text-primary-500">{row.author_name || 'Instructor'} · Submitted {new Date(row.submitted_at).toLocaleString()}</p></div><Link to={`/admin/courses/${row.course_id}/builder`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent-700">Inspect course <ExternalLink className="h-4 w-4" /></Link></div>
        <label className="mt-4 block text-sm font-bold">Decision reason <span className="text-danger-600">*</span><textarea rows={3} minLength={5} required value={notes[row.course_id] || ''} onChange={event => setNotes(value => ({ ...value, [row.course_id]: event.target.value }))} placeholder="Explain why you are approving, requesting changes, or rejecting this course" className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
        <p className="mt-1 text-xs text-primary-500">Required for every decision. The instructor will see this note.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => beginDecision(row, 'approved')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-success-600 px-4 font-bold text-white"><CheckCircle2 className="h-4 w-4" />Approve</button><button type="button" onClick={() => beginDecision(row, 'changes_requested')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw className="h-4 w-4" />Request changes</button><button type="button" onClick={() => beginDecision(row, 'rejected')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-4 font-bold text-danger-700"><XCircle className="h-4 w-4" />Reject</button></div>
      </article>)}</div>}
    </div></main>
    <ConfirmDialog open={Boolean(pending)} title={pending ? `${decisionLabels[pending.decision]}?` : 'Confirm decision'} description={pending ? `This records your decision and sends the review note to the instructor of “${pending.row.title}”.` : ''} confirmLabel={pending ? decisionLabels[pending.decision] : 'Confirm'} confirmTone={pending?.decision === 'approved' ? 'primary' : 'danger'} busy={saving} onCancel={() => setPending(null)} onConfirm={() => void decide()} />
  </div>;
}

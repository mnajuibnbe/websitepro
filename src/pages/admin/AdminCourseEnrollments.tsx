import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, ShieldOff, ShieldCheck, Users } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

interface CourseEnrollmentRow { enrollment_id: string; user_id: string; student_name: string; student_email: string; status: string; enrolled_at: string; }

export function AdminCourseEnrollments() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false);
  const [courseTitle, setCourseTitle] = useState('Course students');
  const [rows, setRows] = useState<CourseEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<CourseEnrollmentRow | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = (type: ToastMessage['type'], message: string) => setToasts(current => [...current, { id: crypto.randomUUID(), type, message }]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const [courseResult, enrollmentResult] = await Promise.all([
      supabase.from('courses').select('title').eq('id', courseId).single(),
      supabase.rpc('admin_get_course_enrollments', { p_course_id: courseId }),
    ]);
    if (courseResult.data?.title) setCourseTitle(courseResult.data.title);
    if (enrollmentResult.error) toast('error', 'Unable to load course enrollments.');
    else setRows((enrollmentResult.data || []) as CourseEnrollmentRow[]);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return rows.filter(row => !term || row.student_name.toLowerCase().includes(term) || row.student_email.toLowerCase().includes(term)); }, [rows, query]);

  const changeAccess = async () => {
    if (!pending || reason.trim().length < 3) return;
    setSaving(true);
    const active = pending.status !== 'active';
    const { error } = await supabase.rpc('admin_set_enrollment_access', { p_enrollment_id: pending.enrollment_id, p_active: active, p_reason: reason.trim() });
    if (error) toast('error', error.message || 'Unable to update course access.');
    else { toast('success', active ? 'Course access restored.' : 'Course access removed.'); setPending(null); setReason(''); await load(); }
    setSaving(false);
  };

  return <div className="min-h-screen bg-primary-50"><AdminSidebar isOpen={sidebar} setIsOpen={setSidebar} /><main className="px-4 pb-24 pt-20 lg:pl-72 lg:pt-8"><div className="mx-auto max-w-6xl">
    <header className="mb-7 flex items-start gap-3"><button type="button" aria-label="Back to courses" onClick={() => navigate('/admin/courses')} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary-200 bg-white text-primary-700"><ArrowLeft className="h-5 w-5" /></button><div><p className="text-sm font-bold text-amber-700">Enrollment management</p><h1 className="break-words text-2xl font-bold text-primary-900 sm:text-3xl">{courseTitle}</h1><p className="mt-1 text-primary-600">Remove or restore access without deleting orders, progress, or quiz history.</p></div></header>
    <section className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm"><div className="border-b border-primary-200 p-4"><label className="relative block max-w-lg"><span className="sr-only">Search students by name or email</span><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or email" className="min-h-11 w-full rounded-xl border border-primary-200 bg-primary-50 py-2 pl-10 pr-4 focus:ring-2 focus:ring-amber-500" /></label></div>
      {loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div> : filtered.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-primary-300" /><p className="font-bold text-primary-900">No enrollments found</p></div> : <div className="divide-y divide-primary-100">{filtered.map(row => <article key={row.enrollment_id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="min-w-0"><h2 className="break-words font-bold text-primary-900">{row.student_name}</h2><p className="break-all text-sm text-primary-600">{row.student_email}</p><p className="mt-1 text-xs text-primary-500">Enrolled {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(row.enrolled_at))}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-primary-100 text-primary-700'}`}>{row.status}</span><button type="button" onClick={() => { setPending(row); setReason(''); }} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${row.status === 'active' ? 'border border-danger-200 text-danger-700 hover:bg-danger-50' : 'border border-success-200 text-success-700 hover:bg-success-50'}`}>{row.status === 'active' ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}{row.status === 'active' ? 'Remove access' : 'Restore access'}</button></div></article>)}</div>}
    </section>
  </div></main>
  {pending && <ConfirmDialog open title={pending.status === 'active' ? 'Remove course access?' : 'Restore course access?'} description={`${pending.student_name} — ${pending.student_email}. Financial and learning history will be preserved.`} confirmLabel={pending.status === 'active' ? 'Remove access' : 'Restore access'} confirmTone={pending.status === 'active' ? 'danger' : 'primary'} busy={saving} onCancel={() => { setPending(null); setReason(''); }} onConfirm={() => void changeAccess()}><label className="mt-4 block text-sm font-bold text-primary-800">Reason <span className="text-danger-600">*</span><textarea autoFocus value={reason} onChange={event => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-primary-200 p-3 font-normal" placeholder="Add an audit reason" /></label>{reason.length > 0 && reason.trim().length < 3 && <p className="mt-1 text-sm text-danger-600">Enter at least 3 characters.</p>}</ConfirmDialog>}
  <ToastContainer toasts={toasts} onDismiss={id => setToasts(current => current.filter(item => item.id !== id))} /></div>;
}

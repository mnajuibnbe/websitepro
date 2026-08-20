import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, Loader2, MessageSquareText, Plus, Save, Star, Trash2, XCircle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PageContainer } from '../../components/layout/PageContainer';
import { supabase } from '../../lib/supabase';

interface PendingReviewRow {
  review_id: string;
  course_id: string;
  course_title: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface CourseOption { id: string; title: string; }
interface LegacyTestimonial { id: number; reviewer_name: string; quote: string; title: string; source_platform: string | null; is_published: boolean; display_order: number; }
interface LegacyEdit { reviewer_name: string; quote: string; title: string; source_platform: string; }
const EMPTY_LEGACY_DRAFT: LegacyEdit = { reviewer_name: '', quote: '', title: 'Tutiba Student', source_platform: '' };

export function AdminStudentReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<PendingReviewRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [legacyTestimonials, setLegacyTestimonials] = useState<LegacyTestimonial[]>([]);
  const [legacyEdits, setLegacyEdits] = useState<Record<number, LegacyEdit>>({});
  const [savingLegacyId, setSavingLegacyId] = useState<number | null>(null);
  const [togglingLegacyId, setTogglingLegacyId] = useState<number | null>(null);
  const [movingLegacyId, setMovingLegacyId] = useState<number | null>(null);
  const [deletingLegacyId, setDeletingLegacyId] = useState<number | null>(null);
  const [newLegacy, setNewLegacy] = useState<LegacyEdit>(EMPTY_LEGACY_DRAFT);
  const [creatingLegacy, setCreatingLegacy] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const [{ data: reviewData, error: reviewError }, { data: courseData, error: courseError }, { data: legacyData, error: legacyError }] = await Promise.all([
      supabase.rpc('admin_list_pending_course_reviews', { p_course_id: courseId || null }),
      supabase.from('courses').select('id,title').order('title'),
      supabase.from('legacy_testimonials').select('id,reviewer_name,quote,title,source_platform,is_published,display_order').order('display_order'),
    ]);
    if (reviewError || courseError || legacyError) setMessage(reviewError?.message || courseError?.message || legacyError?.message || 'Reviews could not be loaded.');
    else {
      setReviews((reviewData || []) as PendingReviewRow[]);
      setCourses((courseData || []) as CourseOption[]);
      const legacy = (legacyData || []) as LegacyTestimonial[];
      setLegacyTestimonials(legacy);
      setLegacyEdits(Object.fromEntries(legacy.map(item => [item.id, { reviewer_name: item.reviewer_name, quote: item.quote, title: item.title, source_platform: item.source_platform || '' }])));
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const decide = async (reviewId: string, decision: 'approved' | 'rejected') => {
    setBusyId(reviewId);
    setMessage('');
    const { error } = await supabase.rpc('admin_moderate_course_review', {
      p_review_id: reviewId,
      p_decision: decision,
      p_note: notes[reviewId]?.trim() || null,
    });
    if (error) setMessage(error.message);
    else {
      setReviews(current => current.filter(review => review.review_id !== reviewId));
      setMessage(`Review ${decision}.`);
    }
    setBusyId(null);
  };

  const saveLegacyTestimonial = async (testimonial: LegacyTestimonial) => {
    const edit = legacyEdits[testimonial.id];
    const reviewer_name = edit?.reviewer_name.trim() || '';
    const quote = edit?.quote.trim() || '';
    const title = edit?.title.trim() || 'Tutiba Student';
    const source_platform = edit?.source_platform.trim() || null;
    if (reviewer_name.length < 2 || quote.length < 10) { setMessage('Add a name (2+ characters) and a quote (10+ characters) before saving.'); return; }
    setSavingLegacyId(testimonial.id);
    const { error } = await supabase.from('legacy_testimonials').update({ reviewer_name, quote, title, source_platform }).eq('id', testimonial.id);
    setSavingLegacyId(null);
    if (error) setMessage(error.message); else { setMessage(`Updated ${reviewer_name}'s testimonial.`); setLegacyTestimonials(current => current.map(item => item.id === testimonial.id ? { ...item, reviewer_name, quote, title, source_platform } : item)); }
  };

  const togglePublished = async (testimonial: LegacyTestimonial) => {
    setTogglingLegacyId(testimonial.id);
    const { error } = await supabase.from('legacy_testimonials').update({ is_published: !testimonial.is_published }).eq('id', testimonial.id);
    setTogglingLegacyId(null);
    if (error) setMessage(error.message); else { setLegacyTestimonials(current => current.map(item => item.id === testimonial.id ? { ...item, is_published: !item.is_published } : item)); setMessage(testimonial.is_published ? `Hid ${testimonial.reviewer_name}'s testimonial from the homepage.` : `${testimonial.reviewer_name}'s testimonial is now visible on the homepage.`); }
  };

  const moveLegacyTestimonial = async (testimonial: LegacyTestimonial, direction: 'up' | 'down') => {
    setMovingLegacyId(testimonial.id);
    const { error } = await supabase.rpc('admin_move_legacy_testimonial', { p_id: testimonial.id, p_direction: direction });
    if (error) { setMessage(error.message); setMovingLegacyId(null); return; }
    await loadReviews();
    setMovingLegacyId(null);
  };

  const deleteLegacyTestimonial = async (testimonial: LegacyTestimonial) => {
    if (!window.confirm(`Delete ${testimonial.reviewer_name}'s testimonial? This cannot be undone.`)) return;
    setDeletingLegacyId(testimonial.id);
    const { error } = await supabase.from('legacy_testimonials').delete().eq('id', testimonial.id);
    setDeletingLegacyId(null);
    if (error) setMessage(error.message); else { setLegacyTestimonials(current => current.filter(item => item.id !== testimonial.id)); setMessage(`Deleted ${testimonial.reviewer_name}'s testimonial.`); }
  };

  const createLegacyTestimonial = async (event: FormEvent) => {
    event.preventDefault();
    const reviewer_name = newLegacy.reviewer_name.trim();
    const quote = newLegacy.quote.trim();
    const title = newLegacy.title.trim() || 'Tutiba Student';
    const source_platform = newLegacy.source_platform.trim() || null;
    if (reviewer_name.length < 2 || quote.length < 10) { setMessage('Add a name (2+ characters) and a quote (10+ characters) before adding a testimonial.'); return; }
    setCreatingLegacy(true);
    const nextOrder = legacyTestimonials.reduce((max, item) => Math.max(max, item.display_order), 0) + 1;
    const { error } = await supabase.from('legacy_testimonials').insert({ reviewer_name, quote, title, source_platform, display_order: nextOrder });
    setCreatingLegacy(false);
    if (error) setMessage(error.message);
    else { setMessage(`Added ${reviewer_name}'s testimonial.`); setNewLegacy(EMPTY_LEGACY_DRAFT); await loadReviews(); }
  };

  return (
    <div className="min-h-screen bg-primary-50" dir="ltr">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main id="main-content" className="pb-24 pt-20 lg:pl-72 lg:pt-8">
        <PageContainer>
          <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="font-bold text-accent-700">Community quality</p><h1 className="text-3xl font-bold text-primary-900">Learner review moderation</h1><p className="mt-2 text-primary-600">Approve or reject submitted course reviews before they appear publicly.</p></div>
            <label className="text-sm font-bold text-primary-800">Filter by course<select value={courseId} onChange={event => setCourseId(event.target.value)} className="mt-2 block min-h-11 min-w-64 rounded-xl border border-primary-200 bg-white px-3 font-normal"><option value="">All courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          </header>

          {message && <p role="status" className="mb-5 rounded-xl border border-primary-200 bg-white p-4 text-sm text-primary-700">{message}</p>}
          {loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /></div> : reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-primary-300 bg-white p-12 text-center"><MessageSquareText className="mx-auto mb-3 h-10 w-10 text-primary-300" /><h2 className="font-bold text-primary-900">No pending learner reviews</h2><p className="mt-1 text-sm text-primary-500">New submissions will appear here for moderation.</p></div> : <div className="space-y-5">{reviews.map(review => <article key={review.review_id} className="rounded-2xl border border-primary-200 bg-white p-5 shadow-sm md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-accent-700">{review.course_title}</p><h2 className="mt-1 text-lg font-bold text-primary-900">{review.reviewer_name}</h2>{review.reviewer_email && <p className="break-all text-xs text-primary-500">{review.reviewer_email}</p>}<div className="mt-3 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-5 w-5 ${star <= review.rating ? 'fill-warning-400 text-warning-400' : 'text-primary-200'}`} />)}</div></div><time dateTime={review.created_at} className="text-sm text-primary-500">Submitted {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(review.created_at))}</time></div><blockquote className="mt-5 whitespace-pre-wrap rounded-xl bg-primary-50 p-4 leading-relaxed text-primary-800">{review.comment}</blockquote><label className="mt-5 block text-sm font-bold text-primary-800">Moderation note <span className="font-normal text-primary-500">(optional)</span><textarea rows={3} maxLength={2000} value={notes[review.review_id] || ''} onChange={event => setNotes(current => ({ ...current, [review.review_id]: event.target.value }))} className="mt-2 w-full rounded-xl border border-primary-200 p-3 font-normal" placeholder="Internal context for this decision" /></label><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={busyId === review.review_id} onClick={() => void decide(review.review_id, 'rejected')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-4 font-bold text-danger-700 transition-colors hover:bg-danger-50 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-1 active:bg-danger-100 disabled:cursor-not-allowed disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button><button type="button" disabled={busyId === review.review_id} onClick={() => void decide(review.review_id, 'approved')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-success-700 px-4 font-bold text-white transition-colors hover:bg-success-800 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-1 active:bg-success-900 disabled:cursor-not-allowed disabled:opacity-50">{busyId === review.review_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve</button></div></article>)}</div>}

          {!loading && <section className="mt-10 rounded-2xl border border-primary-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5"><h2 className="text-xl font-bold text-primary-900">Legacy testimonials</h2><p className="mt-1 text-sm text-primary-600">Shown on the homepage only while no platform course reviews exist yet. Edit, reorder, hide, or remove entries below.</p></div>

            <form onSubmit={createLegacyTestimonial} className="mb-6 rounded-xl border border-dashed border-primary-300 bg-primary-50 p-4">
              <h3 className="font-bold text-primary-900">Add a testimonial</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="block text-sm font-bold text-primary-800">Reviewer name<input value={newLegacy.reviewer_name} onChange={event => setNewLegacy(current => ({ ...current, reviewer_name: event.target.value }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
                <label className="block text-sm font-bold text-primary-800">Professional title <span className="font-normal text-primary-500">(optional)</span><input value={newLegacy.title} onChange={event => setNewLegacy(current => ({ ...current, title: event.target.value }))} maxLength={120} placeholder="Tutiba Student" className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
              </div>
              <label className="mt-3 block text-sm font-bold text-primary-800">Source platform <span className="font-normal text-primary-500">(optional -- only enter a real, known source, e.g. "Udemy")</span><input value={newLegacy.source_platform} onChange={event => setNewLegacy(current => ({ ...current, source_platform: event.target.value }))} maxLength={120} placeholder="Previous Tutiba platform, Udemy, ..." className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
              <label className="mt-3 block text-sm font-bold text-primary-800">Quote<textarea value={newLegacy.quote} onChange={event => setNewLegacy(current => ({ ...current, quote: event.target.value }))} rows={3} maxLength={4000} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal" /></label>
              <button type="submit" disabled={creatingLegacy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-700 px-4 font-bold text-white transition-colors hover:bg-accent-800 disabled:cursor-not-allowed disabled:opacity-50">{creatingLegacy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add testimonial</button>
            </form>

            {legacyTestimonials.length === 0 ? <p className="text-sm text-primary-500">No legacy testimonials yet.</p> : <div className="grid gap-4 md:grid-cols-2">
              {legacyTestimonials.map((testimonial, index) => {
                const edit = legacyEdits[testimonial.id] || EMPTY_LEGACY_DRAFT;
                return <article key={testimonial.id} className={`rounded-xl border p-4 ${testimonial.is_published ? 'border-primary-100 bg-primary-50' : 'border-warning-200 bg-warning-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${testimonial.is_published ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>{testimonial.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{testimonial.is_published ? 'Visible' : 'Hidden'}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Move up" disabled={index === 0 || movingLegacyId === testimonial.id} onClick={() => void moveLegacyTestimonial(testimonial, 'up')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" aria-label="Move down" disabled={index === legacyTestimonials.length - 1 || movingLegacyId === testimonial.id} onClick={() => void moveLegacyTestimonial(testimonial, 'down')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <label className="mt-3 block text-sm font-bold text-primary-800">Reviewer name<input value={edit.reviewer_name} onChange={event => setLegacyEdits(current => ({ ...current, [testimonial.id]: { ...edit, reviewer_name: event.target.value } }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
                  <label className="mt-3 block text-sm font-bold text-primary-800">Quote<textarea value={edit.quote} onChange={event => setLegacyEdits(current => ({ ...current, [testimonial.id]: { ...edit, quote: event.target.value } }))} rows={3} maxLength={4000} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal" /></label>
                  <label className="mt-3 block text-sm font-bold text-primary-800">Professional title<input value={edit.title} onChange={event => setLegacyEdits(current => ({ ...current, [testimonial.id]: { ...edit, title: event.target.value } }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
                  <label className="mt-3 block text-sm font-bold text-primary-800">Source platform <span className="font-normal text-primary-500">(shown publicly, e.g. "Udemy learner")</span><input value={edit.source_platform} onChange={event => setLegacyEdits(current => ({ ...current, [testimonial.id]: { ...edit, source_platform: event.target.value } }))} maxLength={120} placeholder="Previous Tutiba platform, Udemy, ..." className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button type="button" disabled={deletingLegacyId === testimonial.id} onClick={() => void deleteLegacyTestimonial(testimonial)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-3 font-bold text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingLegacyId === testimonial.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete</button>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={togglingLegacyId === testimonial.id} onClick={() => void togglePublished(testimonial)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 px-3 font-bold text-primary-800 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50">{togglingLegacyId === testimonial.id ? <Loader2 className="h-4 w-4 animate-spin" /> : testimonial.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{testimonial.is_published ? 'Hide' : 'Show'}</button>
                      <button type="button" disabled={savingLegacyId === testimonial.id} onClick={() => void saveLegacyTestimonial(testimonial)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingLegacyId === testimonial.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</button>
                    </div>
                  </div>
                </article>;
              })}
            </div>}
          </section>}
        </PageContainer>
      </main>
    </div>
  );
}

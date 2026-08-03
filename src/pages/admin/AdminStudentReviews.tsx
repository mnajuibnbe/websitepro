import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, Save, Star, XCircle } from 'lucide-react';
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
interface LegacyTestimonial { id: number; reviewer_name: string; quote: string; title: string; is_published: boolean; display_order: number; }

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
  const [legacyTitles, setLegacyTitles] = useState<Record<number, string>>({});
  const [savingLegacyId, setSavingLegacyId] = useState<number | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const [{ data: reviewData, error: reviewError }, { data: courseData, error: courseError }, { data: legacyData, error: legacyError }] = await Promise.all([
      supabase.rpc('admin_list_pending_course_reviews', { p_course_id: courseId || null }),
      supabase.from('courses').select('id,title').order('title'),
      supabase.from('legacy_testimonials').select('id,reviewer_name,quote,title,is_published,display_order').order('display_order'),
    ]);
    if (reviewError || courseError || legacyError) setMessage(reviewError?.message || courseError?.message || legacyError?.message || 'Reviews could not be loaded.');
    else {
      setReviews((reviewData || []) as PendingReviewRow[]);
      setCourses((courseData || []) as CourseOption[]);
      setLegacyTestimonials((legacyData || []) as LegacyTestimonial[]);
      setLegacyTitles(Object.fromEntries(((legacyData || []) as LegacyTestimonial[]).map(item => [item.id, item.title])));
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

  const saveLegacyTitle = async (testimonial: LegacyTestimonial) => {
    const title = legacyTitles[testimonial.id]?.trim() || 'Tutiba Student';
    setSavingLegacyId(testimonial.id);
    const { error } = await supabase.from('legacy_testimonials').update({ title }).eq('id', testimonial.id);
    setSavingLegacyId(null);
    if (error) setMessage(error.message); else { setMessage(`Updated ${testimonial.reviewer_name}'s professional title.`); setLegacyTestimonials(current => current.map(item => item.id === testimonial.id ? { ...item, title } : item)); }
  };

  return (
    <div className="min-h-screen bg-primary-50" dir="ltr">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main id="main-content" className="pb-24 pt-20 lg:pl-72 lg:pt-8">
        <PageContainer>
          <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="font-bold text-amber-700">Community quality</p><h1 className="text-3xl font-bold text-primary-900">Learner review moderation</h1><p className="mt-2 text-primary-600">Approve or reject submitted course reviews before they appear publicly.</p></div>
            <label className="text-sm font-bold text-primary-800">Filter by course<select value={courseId} onChange={event => setCourseId(event.target.value)} className="mt-2 block min-h-11 min-w-64 rounded-xl border border-primary-200 bg-white px-3 font-normal"><option value="">All courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          </header>

          {message && <p role="status" className="mb-5 rounded-xl border border-primary-200 bg-white p-4 text-sm text-primary-700">{message}</p>}
          {loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /></div> : reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-primary-300 bg-white p-12 text-center"><MessageSquareText className="mx-auto mb-3 h-10 w-10 text-primary-300" /><h2 className="font-bold text-primary-900">No pending learner reviews</h2><p className="mt-1 text-sm text-primary-500">New submissions will appear here for moderation.</p></div> : <div className="space-y-5">{reviews.map(review => <article key={review.review_id} className="rounded-2xl border border-primary-200 bg-white p-5 shadow-sm md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">{review.course_title}</p><h2 className="mt-1 text-lg font-bold text-primary-900">{review.reviewer_name}</h2>{review.reviewer_email && <p className="break-all text-xs text-primary-500">{review.reviewer_email}</p>}<div className="mt-3 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-5 w-5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-primary-200'}`} />)}</div></div><time dateTime={review.created_at} className="text-sm text-primary-500">Submitted {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(review.created_at))}</time></div><blockquote className="mt-5 whitespace-pre-wrap rounded-xl bg-primary-50 p-4 leading-relaxed text-primary-800">{review.comment}</blockquote><label className="mt-5 block text-sm font-bold text-primary-800">Moderation note <span className="font-normal text-primary-500">(optional)</span><textarea rows={3} maxLength={2000} value={notes[review.review_id] || ''} onChange={event => setNotes(current => ({ ...current, [review.review_id]: event.target.value }))} className="mt-2 w-full rounded-xl border border-primary-200 p-3 font-normal" placeholder="Internal context for this decision" /></label><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={busyId === review.review_id} onClick={() => void decide(review.review_id, 'rejected')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-4 font-bold text-danger-700 hover:bg-danger-50 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button><button type="button" disabled={busyId === review.review_id} onClick={() => void decide(review.review_id, 'approved')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-success-700 px-4 font-bold text-white hover:bg-success-800 disabled:opacity-50">{busyId === review.review_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve</button></div></article>)}</div>}

          {!loading && <section className="mt-10 rounded-2xl border border-primary-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-5"><h2 className="text-xl font-bold text-primary-900">Legacy testimonial titles</h2><p className="mt-1 text-sm text-primary-600">Replace the truthful “Tutiba Student” placeholder only when the reviewer’s professional title is known.</p></div><div className="grid gap-4 md:grid-cols-2">{legacyTestimonials.map(testimonial => <article key={testimonial.id} className="rounded-xl border border-primary-100 bg-primary-50 p-4"><h3 className="font-bold text-primary-900">{testimonial.reviewer_name}</h3><p className="mt-2 line-clamp-2 text-sm text-primary-600">{testimonial.quote}</p><label className="mt-4 block text-sm font-bold text-primary-800">Professional title<input value={legacyTitles[testimonial.id] || ''} onChange={event => setLegacyTitles(current => ({ ...current, [testimonial.id]: event.target.value }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label><button type="button" disabled={savingLegacyId === testimonial.id} onClick={() => void saveLegacyTitle(testimonial)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-4 font-bold text-white disabled:opacity-50">{savingLegacyId === testimonial.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save title</button></article>)}</div></section>}
        </PageContainer>
      </main>
    </div>
  );
}

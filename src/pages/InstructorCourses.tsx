import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Edit3, Loader2, Menu, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Course } from '../types/database.types';

type AuthoredCourse = Course & { review_status?: string; authoring_status?: string; updated_at?: string };

export function InstructorCourses() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState<AuthoredCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from('courses').select('*').eq('author_id', user.id).order('updated_at', { ascending: false });
    if (queryError) setError('Your authored courses could not be loaded.');
    else setCourses((data || []) as AuthoredCourse[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  return <div className="flex min-h-screen bg-primary-50" dir="ltr">
    <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
    <main id="main-content" className="min-w-0 flex-1 p-4 pb-20 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => setIsSidebarOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary-200 bg-white lg:hidden"><Menu className="h-5 w-5" /></button><div><h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">My authored courses</h1><p className="mt-1 text-sm text-primary-600">Create, edit, and track courses through review and publication.</p></div></div>
          <Link to="/instructor/courses/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-bold text-white hover:bg-amber-700"><Plus className="h-5 w-5" />Create course</Link>
        </div>
        {loading && <div role="status" className="flex items-center gap-2 rounded-2xl border border-primary-200 bg-white p-6"><Loader2 className="h-5 w-5 animate-spin" />Loading authored courses…</div>}
        {!loading && error && <div role="alert" className="rounded-2xl border border-danger-200 bg-white p-6"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 px-4 font-bold"><RefreshCw className="h-4 w-4" />Retry</button></div>}
        {!loading && !error && courses.length === 0 && <section className="rounded-2xl border border-dashed border-primary-300 bg-white p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-primary-400" /><h2 className="mt-4 text-xl font-bold">Create your first course</h2><p className="mt-2 text-primary-600">Your drafts and review status will appear here.</p><Link to="/instructor/courses/new" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary-900 px-5 font-bold text-white">Start a course</Link></section>}
        {!loading && !error && courses.length > 0 && <ul className="grid gap-4 md:grid-cols-2">{courses.map((course) => <li key={course.id} className="rounded-2xl border border-primary-200 bg-white p-5 shadow-2xs"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-primary-900">{course.title}</h2><p className="mt-1 line-clamp-2 text-sm text-primary-600">{course.short_description || 'No course summary yet.'}</p></div><span className="shrink-0 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold capitalize">{(course.review_status || course.status || 'draft').replaceAll('_', ' ')}</span></div><div className="mt-5 flex flex-wrap gap-2"><Link to={`/admin/courses/${course.id}/builder`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-4 font-bold text-white"><BookOpen className="h-4 w-4" />Open builder</Link><Link to={`/admin/courses/${course.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 px-4 font-bold text-primary-800"><Edit3 className="h-4 w-4" />Edit details</Link></div></li>)}</ul>}
      </div>
    </main>
  </div>;
}

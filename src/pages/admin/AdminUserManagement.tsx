import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CalendarDays, Clock3, Eye, Loader2, Search, Settings, X } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

interface StudentData {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  activeCourses: number;
  totalCourses: number;
}

interface StudentCourse {
  enrollment_id: string;
  course_id: string;
  title: string;
  slug: string;
  course_status: string;
  access_status: string;
  enrolled_at: string;
  completed_lessons: number;
  total_lessons: number;
  last_accessed_at: string | null;
  payment_status: string | null;
  amount: number | null;
  currency: string | null;
}

interface StudentWorkspace {
  student: { name: string; email: string; joined_at: string };
  summary: { active_courses: number; total_courses: number; last_activity_at: string | null };
  courses: StudentCourse[];
}

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
  : 'Not yet';

const statusClass = (status: string) => status === 'active' || status === 'published' || status === 'paid'
  ? 'bg-success-100 text-success-800'
  : status === 'cancelled' || status === 'archived'
    ? 'bg-amber-50 text-amber-800'
    : 'bg-primary-100 text-primary-700';

export function AdminUserManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [workspace, setWorkspace] = useState<StudentWorkspace | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    void fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedStudent(null);
    document.addEventListener('keydown', close);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedStudent]);

  async function fetchStudents() {
    setIsLoading(true);
    setError('');
    try {
      const { data, error: requestError } = await supabase.rpc('admin_list_students', {
        p_search: '',
        p_limit: 200,
        p_offset: 0,
      });
      if (requestError) throw requestError;
      setStudents(((data || []) as any[]).map(row => ({
        id: row.student_id,
        name: row.full_name || 'Unnamed user',
        email: row.email || 'Email unavailable',
        joinedAt: row.joined_at,
        activeCourses: Number(row.active_courses || 0),
        totalCourses: Number(row.total_courses || 0),
      })));
    } catch (requestError: any) {
      console.error('Unable to load student accounts', requestError);
      setError(requestError?.message || 'Unable to load student accounts.');
    } finally {
      setIsLoading(false);
    }
  }

  async function openStudent(student: StudentData) {
    setSelectedStudent(student);
    setWorkspace(null);
    setDetailsError('');
    setDetailsLoading(true);
    try {
      const { data, error: requestError } = await supabase.rpc('admin_get_student_course_workspace', {
        p_student_id: student.id,
      });
      if (requestError) throw requestError;
      setWorkspace(data as unknown as StudentWorkspace);
    } catch (requestError: any) {
      console.error('Unable to load student course details', requestError);
      setDetailsError(requestError?.message || 'Unable to load this student’s course details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return students.filter(student => !term || student.name.toLowerCase().includes(term) || student.email.toLowerCase().includes(term));
  }, [students, searchQuery]);

  return (
    <PortalLayout sidebar={<AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900">User management</h1>
        <p className="mt-2 text-primary-600">Review student accounts, course access, and learning activity.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-primary-200 p-4">
          <label className="relative block max-w-md flex-1">
            <span className="sr-only">Search users by name or email</span>
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400" />
            <input type="search" placeholder="Search by name or email" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full rounded-lg border border-primary-200 bg-primary-50 py-2 pl-10 pr-4 focus:ring-2 focus:ring-accent-500" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-primary-200 bg-primary-50 font-medium text-primary-600"><tr><th className="px-6 py-4 text-sm">Name</th><th className="px-6 py-4 text-sm">Email address</th><th className="px-6 py-4 text-sm">Joined</th><th className="px-6 py-4 text-sm">Course access</th><th className="px-6 py-4 text-right text-sm">Actions</th></tr></thead>
            <tbody className="divide-y divide-primary-100">
              {isLoading ? <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-500" /><span className="sr-only">Loading students</span></td></tr>
                : error ? <tr><td colSpan={5} className="py-12 text-center"><AlertCircle className="mx-auto mb-3 h-10 w-10 text-danger-600" /><p role="alert" className="mb-4 text-danger-700">{error}</p><Button variant="primary" onClick={() => void fetchStudents()}>Retry</Button></td></tr>
                : filteredStudents.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-primary-500">No users match your search.</td></tr>
                : filteredStudents.map(student => <tr key={student.id} className="transition-colors hover:bg-primary-50/50"><td className="px-6 py-4 font-bold text-primary-900">{student.name}</td><td className="px-6 py-4 text-primary-600" dir="ltr">{student.email}</td><td className="px-6 py-4 text-primary-600" dir="ltr">{formatDate(student.joinedAt)}</td><td className="px-6 py-4 text-primary-600"><strong className="text-primary-900">{student.activeCourses}</strong> active · {student.totalCourses} total</td><td className="px-6 py-4 text-right"><button type="button" onClick={() => void openStudent(student)} aria-label={`View ${student.name}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"><Eye className="h-4 w-4" />View details</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-3 sm:p-6" onMouseDown={event => event.target === event.currentTarget && setSelectedStudent(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="student-details-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-primary-100 p-5 sm:p-6"><div><p className="text-sm font-semibold text-accent-700">Student account</p><h2 id="student-details-title" className="mt-1 text-2xl font-bold text-primary-900">{selectedStudent.name}</h2><p className="mt-1 break-all text-sm text-primary-600">{selectedStudent.email}</p></div><button autoFocus type="button" onClick={() => setSelectedStudent(null)} aria-label="Close user details" className="rounded-lg p-2 text-primary-500 hover:bg-primary-50"><X className="h-5 w-5" /></button></header>
          <div className="overflow-y-auto p-5 sm:p-6">
            {detailsLoading ? <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-primary-600"><Loader2 className="h-7 w-7 animate-spin" />Loading course details…</div>
              : detailsError ? <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800"><p role="alert">{detailsError}</p><button type="button" onClick={() => void openStudent(selectedStudent)} className="mt-3 font-bold underline">Retry</button></div>
              : workspace && <>
                <dl className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-primary-50 p-4"><dt className="text-xs text-primary-500">Course access</dt><dd className="mt-1 text-xl font-bold text-primary-900">{workspace.summary.active_courses} active</dd><p className="text-xs text-primary-500">{workspace.summary.total_courses} total records</p></div><div className="rounded-xl bg-primary-50 p-4"><dt className="text-xs text-primary-500">Joined</dt><dd className="mt-1 font-bold text-primary-900">{formatDate(workspace.student.joined_at)}</dd></div><div className="rounded-xl bg-primary-50 p-4"><dt className="text-xs text-primary-500">Last learning activity</dt><dd className="mt-1 font-bold text-primary-900">{formatDate(workspace.summary.last_activity_at)}</dd></div></dl>
                <div className="mt-6 flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-bold text-primary-900"><BookOpen className="h-5 w-5" />Connected courses</h3><span className="text-sm text-primary-500">{workspace.courses.length} record{workspace.courses.length === 1 ? '' : 's'}</span></div>
                {workspace.courses.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-primary-300 p-8 text-center text-primary-500">This student has no course enrollments.</div>
                  : <div className="mt-3 space-y-3">{workspace.courses.map(course => {
                    const percent = course.total_lessons > 0 ? Math.min(100, Math.round((course.completed_lessons / course.total_lessons) * 100)) : 0;
                    return <article key={course.enrollment_id} className="rounded-xl border border-primary-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h4 className="break-words font-bold text-primary-900">{course.title}</h4><div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(course.access_status)}`}>Access: {course.access_status}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(course.course_status)}`}>Course: {course.course_status}</span>{course.payment_status && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(course.payment_status)}`}>Payment: {course.payment_status}</span>}</div></div><div className="flex shrink-0 flex-wrap gap-2"><Link to={`/admin/courses/${course.course_id}/students`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-900 px-3 py-2 text-sm font-bold text-white"><Settings className="h-4 w-4" />Manage access</Link><Link to={`/course/${course.course_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-bold text-primary-700">View course</Link></div></div>
                      <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-primary-600"><span>Learning progress</span><span>{course.completed_lessons}/{course.total_lessons} lessons · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-primary-100"><div className="h-full rounded-full bg-accent-600" style={{ width: `${percent}%` }} /></div></div>
                      <div className="mt-3 grid gap-2 text-xs text-primary-500 sm:grid-cols-3"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Enrolled {formatDate(course.enrolled_at)}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Last activity {formatDate(course.last_accessed_at)}</span>{course.amount !== null && <span>{course.amount} {course.currency || ''}</span>}</div>
                    </article>;
                  })}</div>}
              </>}
          </div>
        </section>
      </div>}
    </PortalLayout>
  );
}

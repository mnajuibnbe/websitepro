import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { PageContainer } from '../../components/layout/PageContainer';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Layers,
  BookOpen,
  Users,
  Eye,
  Archive,
  CheckCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Filter,
  ExternalLink,
  ListOrdered,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { Permission } from '../../types/auth';
import { supabase } from '../../lib/supabase';
import { Course } from '../../types/database.types';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { formatCourseAmount } from '../../lib/pricing';
import { recordAdminAudit } from '../../lib/adminAudit';

interface CourseListItem extends Course {
  sections_count: number;
  lessons_count: number;
  enrolled_count: number;
}

export function AdminCourseManager() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals & Safety Checks
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<CourseListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [homeOrderSavingId, setHomeOrderSavingId] = useState<string | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleHomeOrderChange = async (courseId: string, rawValue: string, currentOrder: number | null) => {
    const homeOrder = rawValue === '' ? null : Number.parseInt(rawValue, 10);
    if (homeOrder !== null && (!Number.isInteger(homeOrder) || homeOrder < 1)) {
      addToast('error', 'Home 1.');
      return;
    }
    if (homeOrder === currentOrder) return;

    try {
      setHomeOrderSavingId(courseId);
      const { data, error } = await supabase
        .from('courses')
        .update({ home_order: homeOrder, updated_at: new Date().toISOString() })
        .eq('id', courseId)
        .select('id, home_order')
        .maybeSingle();

      if (error || !data) throw error || new Error('Course order update returned no row');
      setCourses((current) => current.map((course) => course.id === courseId ? { ...course, home_order: data.home_order } : course));
      addToast('success', homeOrder === null ? 'Create, review, and manage your course catalog.' : 'Create, review, and manage your course catalog.');
    } catch (error) {
      console.error('Error updating Home course order:', error);
      addToast('error', 'Unable to complete this action. Please try again..');
    } finally {
      setHomeOrderSavingId(null);
    }
  };

  // Fetch Courses with aggregate counts
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Fetch all courses
      const { data: dbCourses, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (courseError) {
        throw courseError;
      }

      if (!dbCourses || dbCourses.length === 0) {
        setCourses([]);
        setIsLoading(false);
        return;
      }

      const courseIds = dbCourses.map((c) => c.id);

      // Fetch section counts
      const { data: sectionsData, error: secErr } = await supabase
        .from('course_sections')
        .select('id, course_id')
        .is('deleted_at', null);

      if (secErr) console.error('Error fetching sections:', secErr);

      // Fetch lesson counts
      const { data: lessonsData, error: lesErr } = await supabase
        .from('lessons')
        .select('id, course_id')
        .is('deleted_at', null);

      if (lesErr) console.error('Error fetching lessons:', lesErr);

      // Fetch enrollment counts
      const { data: enrollmentsData, error: enrErr } = await supabase
        .from('enrollments')
        .select('id, course_id')
        .eq('status', 'active');

      if (enrErr) console.error('Error fetching enrollments:', enrErr);

      // Calculate aggregates
      const sectionCountsMap: Record<string, number> = {};
      (sectionsData || []).forEach((s) => {
        sectionCountsMap[s.course_id] = (sectionCountsMap[s.course_id] || 0) + 1;
      });

      const lessonCountsMap: Record<string, number> = {};
      (lessonsData || []).forEach((l) => {
        lessonCountsMap[l.course_id] = (lessonCountsMap[l.course_id] || 0) + 1;
      });

      const enrollmentCountsMap: Record<string, number> = {};
      (enrollmentsData || []).forEach((e) => {
        enrollmentCountsMap[e.course_id] = (enrollmentCountsMap[e.course_id] || 0) + 1;
      });

      const items: CourseListItem[] = dbCourses.map((c) => ({
        ...c,
        sections_count: sectionCountsMap[c.id] || 0,
        lessons_count: lessonCountsMap[c.id] || 0,
        enrolled_count: enrollmentCountsMap[c.id] || 0,
      }));

      setCourses(items);
    } catch (err: any) {
      console.error('Error fetching courses list:', err);
      setErrorMessage(err.message || 'Create, review, and manage your course catalog.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourses();
  }, [fetchCourses]);

  // Unique categories list
  const categoriesList = Array.from(
    new Set(courses.map((c) => c.category).filter((cat): cat is string => Boolean(cat)))
  );

  // Filtered courses
  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      course.title.toLowerCase().includes(term) ||
      (course.slug && course.slug.toLowerCase().includes(term)) ||
      (course.category && course.category.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' ? true : course.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' ? true : course.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Quick Status Toggle Handler
  const handleUpdateStatus = async (courseId: string, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      const currentCourse = courses.find((c) => c.id === courseId);
      if (newStatus === 'published' || (newStatus === 'draft' && currentCourse?.status === 'published')) {
        const { error } = await supabase.rpc('admin_set_course_publication', { p_course_id: courseId, p_publish: newStatus === 'published' });
        if (error) throw error;
        setCourses((previous) => previous.map(course => course.id === courseId ? { ...course, status: newStatus } : course));
        await recordAdminAudit('status_change', 'course', courseId, { from: currentCourse?.status, to: newStatus });
        addToast('success', newStatus === 'published' ? 'Approved course published.' : 'Course unpublished.');
        return;
      }
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'archived') {
        updates.archived_at = new Date().toISOString();
      }

      if (currentCourse?.status === 'archived' && newStatus !== 'archived') {
        updates.archived_at = null;
      }

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, ...updates } : c))
      );
      await recordAdminAudit('status_change', 'course', courseId, { from: currentCourse?.status, to: newStatus });

      const statusLabels = {
        published: 'Course published.',
        draft: 'Course moved to draft.',
        archived: 'Course archived.',
      };
      addToast('success', statusLabels[newStatus]);
    } catch (err: any) {
      console.error('Error updating course status:', err);
      addToast('error', err.message || 'Course.');
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!selectedCourseForDelete) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase.rpc('admin_delete_empty_course', {
        p_course_id: selectedCourseForDelete.id,
      });

      if (error) {
        console.error('Database deletion error:', error);
        if (error.code === '23503' || error.code === '23514' || error.message?.includes('foreign key constraint')) {
          addToast(
            'error',
            error.message || 'This course has student or order records and must be archived instead.'
          );
          setSelectedCourseForDelete(null);
          return;
        }
        throw error;
      }

      setCourses((prev) => prev.filter((c) => c.id !== selectedCourseForDelete.id));
      await recordAdminAudit('delete', 'course', selectedCourseForDelete.id, { title: selectedCourseForDelete.title });
      addToast('success', 'Course deleted.');
      setSelectedCourseForDelete(null);
    } catch (err: any) {
      console.error('Error deleting course:', err);
      addToast('error', err.message || 'Course.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-8">
        <PageContainer>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-900 mb-1">Courses</h1>
              <p className="text-primary-600 text-sm">
                Create, review, and manage your course catalog.
              </p>
            </div>

            <RequirePermission permission={Permission.CREATE_COURSE}>
              <Button
                variant="primary"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => navigate('/admin/courses/new')}
              >
                Create Course
              </Button>
            </RequirePermission>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl border border-primary-200 p-4 shadow-2xs mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-4 pr-11 py-2.5 bg-primary-50 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500 focus:bg-white text-sm transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-400 flex-shrink-0 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-primary-50 border border-primary-200 text-primary-800 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500 focus:bg-white transition-all font-semibold"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Category Filter */}
            {categoriesList.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-primary-50 border border-primary-200 text-primary-800 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500 focus:bg-white transition-all font-semibold"
                >
                  <option value="all">All categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Error View */}
          {errorMessage && (
            <div className="bg-white border border-danger-200 rounded-2xl p-6 shadow-xs mb-8 text-left">
              <div className="flex items-center gap-3 text-danger-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base">Courses</h3>
              </div>
              <p className="text-primary-700 text-sm mb-4">{errorMessage}</p>
              <Button variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={fetchCourses}>
                Retry
              </Button>
            </div>
          )}

          {/* Main Table / Grid */}
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-600 mx-auto mb-3" />
                <p className="text-primary-600 font-bold text-sm">Loading courses…</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-primary-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-primary-900 mb-1">No items found</h3>
                <p className="text-primary-500 text-sm mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Search.'
                    : 'Create, review, and manage your course catalog. Create, review, and manage your course catalog.'}
                </p>
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/admin/courses/new')}
                >
                  Create Course
                </Button>
              </div>
            ) : (
              <>
              <div className="divide-y divide-primary-100 md:hidden">
                {filteredCourses.map(course => (
                  <article key={course.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {course.thumbnail ? <OptimizedImage src={course.thumbnail} alt="" displayWidth={160} width="160" height="107" className="h-16 w-24 flex-none rounded-lg object-cover" /> : <div className="flex h-16 w-24 flex-none items-center justify-center rounded-lg border border-primary-200 bg-primary-50 text-primary-400"><BookOpen className="h-6 w-6" /></div>}
                      <div className="min-w-0 flex-1"><h2 className="break-words font-bold leading-snug text-primary-900">{course.title}</h2><p className="mt-1 text-sm font-bold text-primary-700">{course.price_egp == null ? 'Price unavailable' : formatCourseAmount(String(course.price_egp), 'EGP')}</p><span className="mt-2 inline-block rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">{course.status}</span></div>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-primary-50 p-3 text-center text-xs"><div><dt className="text-primary-500">Sections</dt><dd className="font-bold text-primary-900">{course.sections_count}</dd></div><div><dt className="text-primary-500">Lessons</dt><dd className="font-bold text-primary-900">{course.lessons_count}</dd></div><div><dt className="text-primary-500">Students</dt><dd className="font-bold text-primary-900">{course.enrolled_count}</dd></div></dl><p className="mt-3 text-xs font-bold text-primary-500">Review: {(course.review_status || 'not_submitted').replace('_', ' ')}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => navigate(`/admin/courses/${course.id}/builder`)} className="min-h-11 rounded-xl bg-accent-600 px-3 text-sm font-bold text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 active:bg-accent-800">Manage course</button><button type="button" onClick={() => navigate(`/admin/courses/${course.id}/students`)} className="min-h-11 rounded-xl border border-primary-200 px-3 text-sm font-bold text-primary-800 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-100">Manage students</button><button type="button" onClick={() => navigate(`/admin/courses/${course.id}/edit`)} className="min-h-11 rounded-xl border border-primary-200 px-3 text-sm font-bold text-primary-800 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-100">Course settings</button><button type="button" onClick={() => setSelectedCourseForDelete(course)} className="min-h-11 rounded-xl border border-danger-200 px-3 text-sm font-bold text-danger-700 transition-colors hover:bg-danger-50 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-1 active:bg-danger-100">Delete course</button></div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-primary-50/80 text-primary-700 font-bold text-xs border-b border-primary-200">
                    <tr>
                      <th className="py-4 px-5">Course</th>
                      <th className="py-4 px-4">Price</th>
                      <th className="py-4 px-4">Curriculum</th>
                      <th className="py-4 px-4">Publication and review</th>
                      <th className="py-4 px-4">Updated</th>
                      <th className="py-4 px-4 text-center">Home order</th>
                      <th className="py-4 px-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100 text-sm">
                    {filteredCourses.map((course) => {
                      const isPublished = course.status === 'published';
                      const isArchived = course.status === 'archived';

                      return (
                        <tr key={course.id} className="hover:bg-primary-50/40 transition-colors group">
                          {/* Title & Thumbnail */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              {course.thumbnail ? (
                                <OptimizedImage displayWidth={240} width="240" height="135"
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-14 h-10 object-cover rounded-lg border border-primary-200 shadow-2xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-10 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-center text-primary-400 flex-shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-primary-900 text-base leading-snug line-clamp-2 group-hover:text-accent-700 transition-colors">
                                  {course.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-primary-500 font-medium">
                                    {course.category || 'Uncategorized'}
                                  </span>
                                  {course.level && (
                                    <span className="rounded-md bg-primary-100 px-2 py-0.5 text-caption font-semibold text-primary-700">
                                      {course.level === 'beginner'
                                        ? 'Beginner'
                                        : course.level === 'intermediate'
                                        ? 'Intermediate'
                                        : course.level === 'advanced'
                                        ? 'Advanced'
                                        : 'course'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4 font-bold text-primary-900">
                            {course.price_egp == null ? <span className="text-primary-500">Unavailable</span> : formatCourseAmount(String(course.price_egp), 'EGP')}
                          </td>

                          {/* Stats */}
                          <td className="py-4 px-4 text-xs text-primary-600 font-medium">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1" title="course">
                                <Layers className="w-3.5 h-3.5 text-primary-400" />
                                {course.sections_count} sections
                              </span>
                              <span className="flex items-center gap-1" title="Lessons">
                                <FileText className="w-3.5 h-3.5 text-primary-400" />
                                {course.lessons_count} Lesson
                              </span>
                              <span className="flex items-center gap-1 text-accent-700 font-bold" title="course">
                                <Users className="w-3.5 h-3.5 text-accent-600" />
                                {course.enrolled_count} students
                              </span>
                            </div>
                          </td>

                          {/* Status & Visibility */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isPublished
                                    ? 'bg-success-100 text-success-800 border border-success-200'
                                    : isArchived
                                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                    : 'bg-warning-100 text-warning-800 border border-warning-200'
                                }`}
                              >
                                {isPublished ? 'Published' : isArchived ? 'Archived' : 'Draft'}
                              </span>
                              <span className="text-caption font-medium text-primary-500">
                                Visibility: {course.visibility === 'private' ? 'Private' : course.visibility === 'unlisted' ? 'Unlisted' : 'Public'}
                              </span>
                              <span className="text-caption font-bold text-primary-600">Review: {(course.review_status || 'not_submitted').replace('_', ' ')}</span>
                            </div>
                          </td>

                          {/* Updated At */}
                          <td className="py-4 px-4 text-xs text-primary-500 font-medium">
                            {new Date(course.updated_at || course.created_at).toLocaleDateString('en-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Home order: lower numbers appear first; blank uses newest-first. */}
                          <td className="py-4 px-4 text-center">
                            <label className="inline-flex items-center gap-2" title="course">
                              <ListOrdered className="w-4 h-4 text-primary-400" />
                              <input
                                key={`${course.id}-${course.home_order ?? 'auto'}`}
                                type="number"
                                min="1"
                                defaultValue={course.home_order ?? ''}
                                onBlur={(event) => handleHomeOrderChange(course.id, event.target.value, course.home_order)}
                                disabled={!isPublished || homeOrderSavingId === course.id}
                                placeholder="Enter details"
                                className="w-20 h-9 px-2 text-center border border-primary-200 rounded-lg bg-white disabled:bg-primary-50 disabled:text-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500"
                                aria-label={`Home page order for ${course.title}`}
                              />
                              {homeOrderSavingId === course.id && <Loader2 className="w-4 h-4 animate-spin text-accent-600" />}
                            </label>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Builder */}
                              <button
                                onClick={() => navigate(`/admin/courses/${course.id}/builder`)}
                                className="p-2 text-accent-700 hover:text-accent-900 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 active:bg-accent-200"
                                aria-label={`Open curriculum builder for ${course.title}`}
                                title="Curriculum builder"
                              >
                                <Sparkles className="w-4 h-4 text-accent-600" />
                                <span className="hidden xl:inline">Curriculum</span>
                              </button>

                              {/* Edit Metadata */}
                              <button
                                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                className="p-2 text-primary-600 hover:text-primary-900 bg-primary-100/60 hover:bg-primary-200/60 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-200"
                                aria-label={`Edit course settings for ${course.title}`}
                                title="Course settings"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button onClick={() => navigate(`/admin/courses/${course.id}/students`)} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary-100 px-2 text-xs font-bold text-primary-700 hover:bg-primary-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-300" aria-label={`Manage students in ${course.title}`} title="Manage students"><Users className="h-4 w-4" /><span className="hidden xl:inline">Students</span></button>

                              {/* Status Toggle Quick Button */}
                              {isPublished ? (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'draft')}
                                  className="p-2 text-warning-700 hover:bg-warning-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-1 active:bg-warning-100"
                                  aria-label={`Unpublish ${course.title}`}
                                  title="Unpublish course"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              ) : course.review_status === 'approved' ? (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'published')}
                                  className="p-2 text-success-700 hover:bg-success-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-1 active:bg-success-100"
                                  aria-label={`Publish approved course ${course.title}`}
                                  title="Publish approved course"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : course.review_status === 'submitted' ? (
                                <button onClick={() => navigate(`/admin/course-reviews/${course.id}`)} className="p-2 text-accent-700 hover:bg-accent-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 active:bg-accent-100" aria-label={`Review ${course.title}`} title="Open submitted review">
                                  <Eye className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => navigate(`/admin/courses/${course.id}/builder`)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-100" aria-label={`Finalize ${course.title}`} title="Complete readiness and finalize">
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}

                              {/* Archive Button */}
                              {!isArchived && (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'archived')}
                                  className="p-2 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-200"
                                  aria-label={`Archive ${course.title}`}
                                  title="Archive course"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => setSelectedCourseForDelete(course)}
                                className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-1 active:bg-danger-100"
                                aria-label={`Delete ${course.title}`}
                                title="Delete course"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </PageContainer>
      </main>

      {/* Delete / Safety Modal */}
      {selectedCourseForDelete && selectedCourseForDelete.enrolled_count > 0 && (
        <ConfirmDialog
          open
          title="Archive course instead?"
          description={`"${selectedCourseForDelete.title}" has ${selectedCourseForDelete.enrolled_count} active enrollment(s), so it cannot be deleted safely. Archiving removes the course from the public catalog while preserving enrolled students' records.`}
          confirmLabel="Archive course"
          confirmTone="primary"
          onCancel={() => setSelectedCourseForDelete(null)}
          onConfirm={() => {
            handleUpdateStatus(selectedCourseForDelete.id, 'archived');
            setSelectedCourseForDelete(null);
          }}
        />
      )}
      {selectedCourseForDelete && selectedCourseForDelete.enrolled_count === 0 && (
        <ConfirmDialog
          open
          title="Delete course?"
          description={`"${selectedCourseForDelete.title}" will be permanently deleted. This action cannot be undone.`}
          confirmLabel="Delete"
          confirmTone="danger"
          busy={isDeleting}
          onCancel={() => setSelectedCourseForDelete(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

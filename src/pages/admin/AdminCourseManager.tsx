import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
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
      addToast('error', 'ترتيب الرئيسية يجب أن يكون رقماً صحيحاً يبدأ من 1.');
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
      addToast('success', homeOrder === null ? 'تمت إعادة الكورس للترتيب التلقائي حسب الأحدث.' : 'تم تحديث ترتيب الكورس في الرئيسية.');
    } catch (error) {
      console.error('Error updating Home course order:', error);
      addToast('error', 'تعذر تحديث ترتيب الكورس في الرئيسية.');
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
        .select('id, course_id');

      if (secErr) console.error('Error fetching sections:', secErr);

      // Fetch lesson counts
      const { data: lessonsData, error: lesErr } = await supabase
        .from('lessons')
        .select('id, course_id');

      if (lesErr) console.error('Error fetching lessons:', lesErr);

      // Fetch enrollment counts
      const { data: enrollmentsData, error: enrErr } = await supabase
        .from('enrollments')
        .select('id, course_id');

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
      setErrorMessage(err.message || 'حدث خطأ أثناء جلب قائمة الكورسات.');
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
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'published') {
        if (!currentCourse?.published_at) {
          updates.published_at = new Date().toISOString();
        }
        if (currentCourse?.visibility === 'private') {
          addToast('info', 'الكورس منشور ولكنه محدد كـ "خاص" (Private)، ولن يظهر في التصفح العام.');
        }
      } else if (newStatus === 'archived') {
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

      const statusLabels = {
        published: 'تم نشر الكورس بنجاح',
        draft: 'تم تحويل الكورس إلى مسودة',
        archived: 'تم أرشفة الكورس بنجاح',
      };
      addToast('success', statusLabels[newStatus]);
    } catch (err: any) {
      console.error('Error updating course status:', err);
      addToast('error', err.message || 'تعذر تحديث حالة الكورس.');
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!selectedCourseForDelete) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', selectedCourseForDelete.id);

      if (error) {
        console.error('Database deletion error:', error);
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
          addToast(
            'error',
            'تعذر حذف الكورس مباشرة لوجود أقسام أو دروس أو بيانات مرتبطة به. يُنصح بأرشفة الكورس بدلاً من حذفه.'
          );
          setSelectedCourseForDelete(null);
          return;
        }
        throw error;
      }

      setCourses((prev) => prev.filter((c) => c.id !== selectedCourseForDelete.id));
      addToast('success', 'تم حذف الكورس بنجاح');
      setSelectedCourseForDelete(null);
    } catch (err: any) {
      console.error('Error deleting course:', err);
      addToast('error', err.message || 'تعذر حذف الكورس.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-900 mb-1">إدارة الكورسات</h1>
              <p className="text-primary-600 text-sm">
                عرض وإدارة جميع الكورسات في المنصة، وإنشاء كورسات جديدة أو تعديل حالات النشر.
              </p>
            </div>

            <RequirePermission permission={Permission.CREATE_COURSE}>
              <Button
                variant="primary"
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-xs"
                onClick={() => navigate('/admin/courses/new')}
              >
                <Plus className="w-5 h-5" />
                <span>إنشاء كورس جديد</span>
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
                placeholder="ابحث باسم الكورس أو التصنيف..."
                className="w-full pl-4 pr-11 py-2.5 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-400 flex-shrink-0 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-primary-50 border border-primary-200 text-primary-800 text-sm rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-semibold"
              >
                <option value="all">جميع الحالات</option>
                <option value="published">منشور (Published)</option>
                <option value="draft">مسودة (Draft)</option>
                <option value="archived">مؤرشف (Archived)</option>
              </select>
            </div>

            {/* Category Filter */}
            {categoriesList.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-primary-50 border border-primary-200 text-primary-800 text-sm rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-semibold"
                >
                  <option value="all">جميع التصنيفات</option>
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
            <div className="bg-white border border-danger-200 rounded-2xl p-6 shadow-xs mb-8 text-right">
              <div className="flex items-center gap-3 text-danger-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base">حدث خطأ أثناء تحميل الكورسات</h3>
              </div>
              <p className="text-primary-700 text-sm mb-4">{errorMessage}</p>
              <button
                onClick={fetchCourses}
                className="inline-flex items-center gap-2 bg-primary-900 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-primary-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          {/* Main Table / Grid */}
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
                <p className="text-primary-600 font-bold text-sm">جاري تحميل قائمة الكورسات...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-primary-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-primary-900 mb-1">لا توجد كورسات مطابقة</h3>
                <p className="text-primary-500 text-sm mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'جرب تغيير كلمة البحث أو إعادة ضبط الفلاتر.'
                    : 'لم تقم بإضافة أي كورس بعد. يمكنك البدء بإنشاء أول كورس الآن.'}
                </p>
                <Button
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
                  onClick={() => navigate('/admin/courses/new')}
                >
                  <Plus className="w-4 h-4 ml-2 inline" />
                  <span>إنشاء كورس جديد</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-primary-50/80 text-primary-700 font-bold text-xs border-b border-primary-200">
                    <tr>
                      <th className="py-4 px-5">الكورس والتصنيف</th>
                      <th className="py-4 px-4">السعر</th>
                      <th className="py-4 px-4">الإحصائيات</th>
                      <th className="py-4 px-4">الحالة والظهور</th>
                      <th className="py-4 px-4">آخر تحديث</th>
                      <th className="py-4 px-4 text-center">ترتيب الرئيسية</th>
                      <th className="py-4 px-5 text-center">الإجراءات والتحكم</th>
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
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-14 h-10 object-cover rounded-lg border border-primary-200 shadow-2xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-10 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-primary-900 text-base leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
                                  {course.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-primary-500 font-medium">
                                    {course.category || 'بدون تصنيف'}
                                  </span>
                                  {course.level && (
                                    <span className="text-[11px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md font-semibold">
                                      {course.level === 'beginner'
                                        ? 'مبتدئ'
                                        : course.level === 'intermediate'
                                        ? 'متوسط'
                                        : course.level === 'advanced'
                                        ? 'متقدم'
                                        : 'جميع المستويات'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4 font-bold text-primary-900">
                            {course.price ? `${course.price} ر.س` : <span className="text-emerald-600 font-bold">مجاني</span>}
                          </td>

                          {/* Stats */}
                          <td className="py-4 px-4 text-xs text-primary-600 font-medium">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1" title="عدد الأقسام">
                                <Layers className="w-3.5 h-3.5 text-primary-400" />
                                {course.sections_count} قسم
                              </span>
                              <span className="flex items-center gap-1" title="عدد الدروس">
                                <FileText className="w-3.5 h-3.5 text-primary-400" />
                                {course.lessons_count} درس
                              </span>
                              <span className="flex items-center gap-1 text-amber-700 font-bold" title="عدد المسجلين">
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                                {course.enrolled_count} طالب
                              </span>
                            </div>
                          </td>

                          {/* Status & Visibility */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isPublished
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isArchived
                                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isPublished ? 'منشور' : isArchived ? 'مؤرشف' : 'مسودة'}
                              </span>
                              <span className="text-[11px] text-primary-500 font-medium">
                                الظهور: {course.visibility === 'private' ? 'خاص' : course.visibility === 'unlisted' ? 'غير مدرج' : 'عنصر عام'}
                              </span>
                            </div>
                          </td>

                          {/* Updated At */}
                          <td className="py-4 px-4 text-xs text-primary-500 font-medium">
                            {new Date(course.updated_at || course.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Home order: lower numbers appear first; blank uses newest-first. */}
                          <td className="py-4 px-4 text-center">
                            <label className="inline-flex items-center gap-2" title="اتركيه فارغاً للترتيب التلقائي حسب الأحدث">
                              <ListOrdered className="w-4 h-4 text-primary-400" />
                              <input
                                key={`${course.id}-${course.home_order ?? 'auto'}`}
                                type="number"
                                min="1"
                                defaultValue={course.home_order ?? ''}
                                onBlur={(event) => handleHomeOrderChange(course.id, event.target.value, course.home_order)}
                                disabled={!isPublished || homeOrderSavingId === course.id}
                                placeholder="تلقائي"
                                className="w-20 h-9 px-2 text-center border border-primary-200 rounded-lg bg-white disabled:bg-primary-50 disabled:text-primary-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                aria-label={`ترتيب ${course.title} في الصفحة الرئيسية`}
                              />
                              {homeOrderSavingId === course.id && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                            </label>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Builder */}
                              <button
                                onClick={() => navigate(`/admin/courses/${course.id}/builder`)}
                                className="p-2 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
                                title="فتح Course Builder"
                              >
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span className="hidden xl:inline">البناء</span>
                              </button>

                              {/* Edit Metadata */}
                              <button
                                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                className="p-2 text-primary-600 hover:text-primary-900 bg-primary-100/60 hover:bg-primary-200/60 rounded-lg transition-colors"
                                title="تعديل البيانات"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Status Toggle Quick Button */}
                              {isPublished ? (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'draft')}
                                  className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="تحويل إلى مسودة"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'published')}
                                  className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="نشر الكورس"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Archive Button */}
                              {!isArchived && (
                                <button
                                  onClick={() => handleUpdateStatus(course.id, 'archived')}
                                  className="p-2 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                                  title="أرشفة الكورس"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => setSelectedCourseForDelete(course)}
                                className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                                title="حذف الكورس"
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
            )}
          </div>
        </div>
      </main>

      {/* Delete / Safety Modal */}
      {selectedCourseForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {selectedCourseForDelete.enrolled_count > 0 ? (
              // Case 1: Students enrolled -> Block direct delete & suggest archive
              <>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-primary-900 mb-2">تعذر حذف الكورس مباشرة</h3>

                <p className="text-primary-700 text-sm leading-relaxed mb-4">
                  الكورس <span className="font-bold text-primary-900">"{selectedCourseForDelete.title}"</span> يحتوي على{' '}
                  <span className="font-bold text-amber-700">{selectedCourseForDelete.enrolled_count} طلاب مسجلين</span>.
                </p>

                <p className="text-xs text-primary-500 leading-relaxed bg-primary-50 p-3 rounded-xl border border-primary-200 mb-6">
                  حذف الكورس مباشرة سينهك سجلات الطلاب. يُفضل تغيير حالة الكورس إلى "مؤرشف" لإخفائه عن الطلاب الجدد مع الحفاظ على حق الطلاب المسجلين سابقاً.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedCourseForDelete.id, 'archived');
                      setSelectedCourseForDelete(null);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                  >
                    أرشفة الكورس الآن
                  </button>
                  <button
                    onClick={() => setSelectedCourseForDelete(null)}
                    className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            ) : (
              // Case 2: 0 Students enrolled -> Allow direct deletion with confirmation
              <>
                <div className="w-12 h-12 bg-danger-50 text-danger-600 rounded-2xl flex items-center justify-center mb-4 border border-danger-200">
                  <Trash2 className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-primary-900 mb-2">تأكيد حذف الكورس</h3>

                <p className="text-primary-700 text-sm leading-relaxed mb-6">
                  هل أنت تأكد من رغبتك في حذف الكورس <span className="font-bold text-primary-900">"{selectedCourseForDelete.title}"</span>؟
                  هذا الإجراء غير قابل للتراجع.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-danger-600 hover:bg-danger-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الحذف'}
                  </button>
                  <button
                    onClick={() => setSelectedCourseForDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

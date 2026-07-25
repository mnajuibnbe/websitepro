import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  ArrowRight,
  Save,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  Globe,
  Tag,
  Eye,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Course } from '../../types/database.types';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';

export function AdminCourseEdit() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels');
  const [language, setLanguage] = useState('العربية');
  const [price, setPrice] = useState('0');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [thumbnail, setThumbnail] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [instructorId, setInstructorId] = useState('');

  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);

  // Validation & Toasts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  // Load course data
  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setErrorMessage('معرّف الكورس غير صالح.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Load instructors
      const { data: profData } = await supabase.from('profiles').select('id, full_name');
      if (profData) {
        setInstructors(profData.map((p) => ({ id: p.id, name: p.full_name || 'مدرب' })));
      }

      // Fetch course
      const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      if (!course) {
        setErrorMessage('لم يتم العثور على الكورس المطلوب.');
        setIsLoading(false);
        return;
      }

      // Populate form
      setTitle(course.title || '');
      setSlug(course.slug || '');
      setShortDescription(course.short_description || '');
      setDescription(course.description || '');
      setCategory(course.category || 'العناية بالبشرة');
      setLevel((course.level as any) || 'all_levels');
      setLanguage(course.language || 'العربية');
      setPrice(course.price ? String(course.price) : '0');
      setStatus((course.status as any) || 'draft');
      setVisibility((course.visibility as any) || 'public');
      setThumbnail(course.thumbnail || '');
      setCoverImage(course.cover_image || '');
      setInstructorId(course.instructor_id || '');
    } catch (err: any) {
      console.error('Error fetching course details:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء تحميل بيانات الكورس.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCourse();
  }, [loadCourse]);

  const generateSlug = () => {
    if (!title.trim()) return;
    const cleanSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(cleanSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'عنوان الكورس مطلوب';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'يرجى تصحيح الأخطاء قبل الحفظ.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Check slug uniqueness if provided
      if (slug.trim()) {
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', slug.trim())
          .neq('id', courseId)
          .maybeSingle();

        if (existingCourse) {
          setErrors({ slug: 'رابط الكورس (Slug) مستخدم بالفعل في كورس آخر' });
          addToast('error', 'رابط الكورس مستخدم بالفعل، يرجى كتابة رابط فريد.');
          setIsSubmitting(false);
          return;
        }
      }

      const parsedPrice = parseFloat(price) || 0;

      const updates: Partial<Course> = {
        title: title.trim(),
        slug: slug.trim() || null,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        category: category.trim() || null,
        level: level,
        language: language.trim() || 'العربية',
        price: parsedPrice,
        status: status,
        visibility: visibility,
        thumbnail: thumbnail.trim() || null,
        cover_image: coverImage.trim() || null,
        instructor_id: instructorId || null,
        updated_at: new Date().toISOString(),
      };

      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;

      addToast('success', 'تم حفظ التعديلات بنجاح!');
    } catch (err: any) {
      console.error('Error updating course:', err);
      addToast('error', err.message || 'تعذر حفظ التعديلات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/courses')}
                className="p-2 bg-white rounded-xl border border-primary-200 text-primary-600 hover:text-primary-900 transition-colors"
                title="العودة لقائمة الكورسات"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">تعديل بيانات الكورس</h1>
                <p className="text-primary-600 text-xs sm:text-sm">
                  تحديث البيانات الأساسية، التصنيف، السعر وحالة النشر.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/admin/courses/${courseId}/builder`)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors"
              >
                <Sparkle className="w-4 h-4 text-amber-600" />
                <span>فتح Course Builder</span>
              </button>

              <Button
                type="submit"
                form="edit-course-form"
                disabled={isSubmitting || isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white border border-primary-200 rounded-2xl p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-primary-700 font-bold text-sm">جاري جلب بيانات الكورس...</p>
            </div>
          ) : errorMessage ? (
            /* Error State */
            <div className="bg-white border border-danger-200 rounded-2xl p-6 md:p-8 text-right shadow-xs">
              <div className="flex items-center gap-3 text-danger-600 mb-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold text-lg">خطأ في جلب الكورس</h3>
              </div>
              <p className="text-primary-700 text-sm mb-6">{errorMessage}</p>
              <button
                onClick={loadCourse}
                className="inline-flex items-center gap-2 bg-primary-900 text-white font-bold text-sm py-2.5 px-6 rounded-xl hover:bg-primary-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            /* Edit Form */
            <form id="edit-course-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-600" />
                  <span>المعلومات الأساسية</span>
                </h2>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">
                      عنوان الكورس <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium ${
                        errors.title ? 'border-danger-400 bg-danger-50/50' : 'border-primary-200'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-danger-600 font-bold mt-1.5">{errors.title}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-primary-900">
                        رابط الكورس المخصص (Slug)
                      </label>
                      <button
                        type="button"
                        onClick={generateSlug}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>توليد من العنوان</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
                      }}
                      dir="ltr"
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm font-mono"
                    />
                    {errors.slug && (
                      <p className="text-xs text-danger-600 font-bold mt-1.5">{errors.slug}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">الوصف المختصر</label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">الوصف الشامل</label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Status, Category & Pricing */}
              <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-600" />
                  <span>حالة النشر والتصنيف</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">حالة الكورس</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="draft">مسودة (Draft)</option>
                      <option value="published">منشور (Published)</option>
                      <option value="archived">مؤرشف (Archived)</option>
                    </select>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">مستوى الظهور</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="public">عام (مدرج بكافة الأقسام)</option>
                      <option value="unlisted">غير مدرج (متاح عبر الرابط المباشر فقط)</option>
                      <option value="private">خاص (مغلق للمسجلين فقط)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">التصنيف</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">المستوى</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="all_levels">جميع المستويات</option>
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">السعر (ر.س)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">اللغة</label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Instructor */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-primary-900 mb-2">المُدرّس المسند</label>
                    <select
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                    >
                      <option value="">-- اختار مدرّس --</option>
                      {instructors.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  <span>الصور والوسائط</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">رابط الصورة المصغرة</label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm"
                    />
                    {thumbnail && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-primary-200 h-32 bg-black/5">
                        <img src={thumbnail} alt="معاينة" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Cover */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">رابط صورة الغلاف</label>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-left transition-all text-sm"
                    />
                    {coverImage && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-primary-200 h-32 bg-black/5">
                        <img src={coverImage} alt="معاينة" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/courses')}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-xs text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>حفظ التغييرات</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

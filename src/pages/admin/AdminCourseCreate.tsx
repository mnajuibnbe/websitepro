import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Globe,
  Tag,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/layout/PageContainer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { sanitizeCourseSlug, validateCourseForm } from '../../lib/adminCourseForm';
import { recordAdminAudit } from '../../lib/adminAudit';
import { CourseCoverUpload } from '../../components/admin/course/CourseCoverUpload';
import { InstructorPicker } from '../../components/admin/course/InstructorPicker';
import { CourseEditorGuide } from '../../components/admin/course/CourseEditorGuide';
import { CategoryField } from '../../components/admin/course/CategoryField';
import { COURSE_LANGUAGES } from '../../domain/courseTaxonomy';
import { COURSE_DESCRIPTION_MIN_LENGTH, COURSE_SUMMARY_MIN_LENGTH } from '../../domain/courseReadiness';

// Helper to sanitize slug
export const sanitizeSlug = sanitizeCourseSlug;

export function AdminCourseCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels');
  const [language, setLanguage] = useState('English');
  const [priceEgp, setPriceEgp] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [instructorId, setInstructorId] = useState('');

  // Instructors list for dropdown

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

  useEffect(() => { window.scrollTo(0, 0); }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double click

    // Validation
    const newErrors = validateCourseForm({ title, slug: '', shortDescription, description, priceEgp, priceUsd });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Review the highlighted fields before creating the course.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {

      const { data: rpcCourseId, error: rpcError } = isInstructor
        ? await supabase.rpc('instructor_create_course_dual', {
          p_title: title.trim(), p_short_description: shortDescription.trim() || null, p_description: description.trim() || null,
          p_category: category.trim() || null, p_level: level, p_language: language.trim() || 'English',
          p_price_egp: priceEgp, p_price_usd: priceUsd, p_thumbnail: coverImage.trim() || null, p_cover_image: coverImage.trim() || null,
        })
        : await supabase.rpc('admin_create_course_dual', {
          p_title: title.trim(), p_slug: null, p_short_description: shortDescription.trim() || null, p_description: description.trim() || null,
          p_category: category.trim() || null, p_level: level, p_language: language.trim() || 'English', p_price_egp: priceEgp,
          p_price_usd: priceUsd, p_instructor_id: instructorId || null, p_thumbnail: coverImage.trim() || null,
          p_cover_image: coverImage.trim() || null, p_create_first_section: false,
        });

      if (rpcError) {
        console.error('RPC admin_create_course error:', rpcError);
        let errorMsg = 'Unable to complete this action. Please try again. (RPC).';
        if (rpcError.message?.includes('duplicate key') || rpcError.message?.includes('courses_slug_key')) {
          errorMsg = 'Course (Slug) Link.';
          setErrors({ slug: errorMsg });
        }
        addToast('error', errorMsg);
        setIsSubmitting(false);
        return;
      }

      if (!rpcCourseId) {
        addToast('error', 'Build practical skills with structured, expert-led course content..');
        setIsSubmitting(false);
        return;
      }

      await recordAdminAudit('create', 'course', String(rpcCourseId), { title: title.trim() });
      addToast('success', 'Course draft created.');
      setTimeout(() => {
        navigate(`/admin/courses/${rpcCourseId}/builder`);
      }, 800);
    } catch (err: any) {
      console.error('Error creating course:', err);
      addToast('error', err.message || 'Build practical skills with structured, expert-led course content..');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-8">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(isInstructor ? '/instructor/courses' : '/admin/courses')}
                className="p-2 bg-white rounded-xl border border-primary-200 text-primary-600 hover:text-primary-900 transition-colors"
                title="Courses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Create course</h1>
                <p className="text-primary-600 text-xs sm:text-sm">
                  Add the course details, pricing, instructor, and media before building the curriculum.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              form="create-course-form"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Create...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>

          <CourseEditorGuide steps={[
            { id: 'course-basics', label: 'Basics', description: 'Title and sales description', complete: Boolean(title.trim() && shortDescription.trim().length >= COURSE_SUMMARY_MIN_LENGTH && description.trim().length >= COURSE_DESCRIPTION_MIN_LENGTH) },
            { id: 'course-classification', label: 'Catalog', description: 'Category, level, and language', complete: Boolean(category && level && language) },
            { id: 'course-commerce', label: isInstructor ? 'Pricing' : 'Pricing & instructor', description: isInstructor ? 'Regional course prices' : 'Regional prices and course owner', complete: Boolean(priceEgp && priceUsd && (isInstructor || instructorId)) },
            { id: 'course-media', label: 'Cover', description: 'One reusable course image', complete: Boolean(coverImage.trim()) },
          ]} />
          <form id="create-course-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Info */}
            <div id="course-basics" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <span>Basic Information</span>
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Course title <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder="Example: Professional Skin Care Diploma"
                    className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium ${
                      errors.title ? 'border-danger-400 bg-danger-50/50' : 'border-primary-200'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-danger-600 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>



                {/* Short Description */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Course summary <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => { setShortDescription(e.target.value); if (errors.shortDescription) setErrors((prev) => ({ ...prev, shortDescription: '' })); }}
                    minLength={COURSE_SUMMARY_MIN_LENGTH}
                    required
                    aria-describedby="course-summary-help"
                    placeholder="Summarize the course for catalog cards"
                    className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm ${errors.shortDescription ? 'border-danger-400' : 'border-primary-200'}`}
                  />
                  <p id="course-summary-help" className={`mt-1.5 text-xs ${errors.shortDescription ? 'font-bold text-danger-600' : 'text-primary-500'}`}>{errors.shortDescription || `${shortDescription.trim().length}/${COURSE_SUMMARY_MIN_LENGTH} minimum characters required for review.`}</p>
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">
                    Full course description <span className="text-danger-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((prev) => ({ ...prev, description: '' })); }}
                    minLength={COURSE_DESCRIPTION_MIN_LENGTH}
                    required
                    aria-describedby="course-description-help"
                    placeholder="Build practical skills with structured, expert-led course content...."
                    className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm leading-relaxed resize-y ${errors.description ? 'border-danger-400' : 'border-primary-200'}`}
                  />
                  <p id="course-description-help" className={`mt-1.5 text-xs ${errors.description ? 'font-bold text-danger-600' : 'text-primary-500'}`}>{errors.description || `${description.trim().length}/${COURSE_DESCRIPTION_MIN_LENGTH} minimum characters required for review.`}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Classification & Pricing */}
            <div id="course-classification" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-600" />
                <span>Catalog details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <CategoryField value={category} onChange={setCategory} />

                {/* Level */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold"
                  >
                    <option value="all_levels">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">Course Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-bold">{COURSE_LANGUAGES.map(item => <option key={item}>{item}</option>)}</select>
                </div>

                <div id="course-commerce" className="scroll-mt-24">
                  <label className="block text-sm font-bold text-primary-900 mb-2">Egypt Price (EGP) *</label>
                  <input type="number" min="0" step="0.01" required value={priceEgp} onChange={(e) => setPriceEgp(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl" />
                  {errors.priceEgp && <p className="text-xs text-danger-600 mt-1">{errors.priceEgp}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">International Price (USD) *</label>
                  <input type="number" min="0" step="0.01" required value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl" />
                  {errors.priceUsd && <p className="text-xs text-danger-600 mt-1">{errors.priceUsd}</p>}
                </div>

                {/* Instructor */}
                {!isInstructor && <div className="md:col-span-2"><InstructorPicker value={instructorId} onChange={setInstructorId} /></div>}
              </div>
            </div>

            {/* Section 3: Media */}
            <div id="course-media" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <span>Course cover</span>
              </h2>

              <CourseCoverUpload value={coverImage} onChange={setCoverImage} />
            </div>

            {/* Bottom Form Action */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(isInstructor ? '/dashboard' : '/admin/courses')}
                className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-xs text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Save...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Course Builder</span>
                  </>
                )}
              </Button>
            </div>
          </form>
          </div>
        </PageContainer>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

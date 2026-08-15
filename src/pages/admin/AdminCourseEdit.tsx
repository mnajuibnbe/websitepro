import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import {
  ArrowLeft,
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
  Video,
  Flame,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/layout/PageContainer';
import { supabase } from '../../lib/supabase';
import { Course } from '../../types/database.types';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';

import { sanitizeCourseSlug as sanitizeSlug, validateCourseForm } from '../../lib/adminCourseForm';
import { recordAdminAudit } from '../../lib/adminAudit';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { isRichTextEmpty, richTextVisibleLength, sanitizeRichText } from '../../lib/richTextHtml';
import { CourseCoverUpload } from '../../components/admin/course/CourseCoverUpload';
import { InstructorPicker } from '../../components/admin/course/InstructorPicker';
import { CourseEditorGuide } from '../../components/admin/course/CourseEditorGuide';
import { CategoryField } from '../../components/admin/course/CategoryField';
import { COURSE_LANGUAGES } from '../../domain/courseTaxonomy';
import { useAuth } from '../../contexts/AuthContext';
import { COURSE_DESCRIPTION_MIN_LENGTH, COURSE_SUMMARY_MIN_LENGTH } from '../../domain/courseReadiness';
import { DynamicListEditor } from '../../components/admin/course/DynamicListEditor';

export function AdminCourseEdit() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial course data for comparison
  const [originalCourse, setOriginalCourse] = useState<Course | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels');
  const [language, setLanguage] = useState('English');
  const [priceEgp, setPriceEgp] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [coverImage, setCoverImage] = useState('');
  const [trailerVideo, setTrailerVideo] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [curriculumHighlights, setCurriculumHighlights] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);


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
      setErrorMessage('Course.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);



      // Fetch course
      const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      if (!course) {
        setErrorMessage('Build practical skills with structured, expert-led course content..');
        setIsLoading(false);
        return;
      }

      setOriginalCourse(course);

      // Populate form
      setTitle(course.title || '');
      setSlug(course.slug || '');
      setShortDescription(course.short_description || '');
      setDescription(course.description || '');
      setCategory(course.category || 'Uncategorized');
      setLevel((course.level as any) || 'all_levels');
      setLanguage(course.language || 'English');
      setPriceEgp(course.price_egp == null ? '' : String(course.price_egp));
      setPriceUsd(course.price_usd == null ? '' : String(course.price_usd));
      setStatus((course.status as any) || 'draft');
      setVisibility((course.visibility as any) || 'public');
      setCoverImage(course.cover_image || course.thumbnail || '');
      setTrailerVideo(course.trailer_video || '');
      setInstructorId(course.instructor_id || '');
      setLearningOutcomes(Array.isArray(course.learning_outcomes) ? course.learning_outcomes : []);
      setRequirements(Array.isArray(course.requirements) ? course.requirements : []);
      setTargetAudience(Array.isArray(course.target_audience) ? course.target_audience : []);
      setCurriculumHighlights(Array.isArray(course.curriculum_highlights) ? course.curriculum_highlights : []);
      setIsFeatured(Boolean(course.is_featured));
      setIsBestseller(Boolean(course.is_bestseller));
    } catch (err: any) {
      console.error('Error fetching course details:', err);
      setErrorMessage(err.message || 'Build practical skills with structured, expert-led course content..');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCourse();
  }, [loadCourse]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || isSubmitting) return;

    // Validation
    const newErrors = validateCourseForm({ title, slug, shortDescription, description, priceEgp, priceUsd, learningOutcomes, requirements, targetAudience, curriculumHighlights });
    const cleanSlug = slug.trim() ? sanitizeSlug(slug) : '';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Save.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Check slug uniqueness if provided
      if (cleanSlug) {
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', cleanSlug)
          .neq('id', courseId)
          .maybeSingle();

        if (existingCourse) {
          setErrors({ slug: 'Course (Slug) Please review the information and try again..' });
          addToast('error', 'Please review the information and try again..');
          setIsSubmitting(false);
          return;
        }
      }

      const updates: Partial<Course> = {
        title: title.trim(),
        slug: cleanSlug || null,
        short_description: shortDescription.trim() || null,
        description: isRichTextEmpty(description) ? null : sanitizeRichText(description),
        category: category.trim() || null,
        level: level,
        language: language.trim() || 'English',
        price_egp: priceEgp,
        price_usd: priceUsd,
        status: status === 'published' || originalCourse?.status === 'published' ? originalCourse?.status : status,
        visibility: visibility,
        thumbnail: coverImage.trim() || null,
        cover_image: coverImage.trim() || null,
        trailer_video: trailerVideo.trim() || null,
        instructor_id: instructorId || null,
        learning_outcomes: learningOutcomes.map(item => item.trim()),
        requirements: requirements.map(item => item.trim()),
        target_audience: targetAudience.map(item => item.trim()),
        curriculum_highlights: curriculumHighlights.length ? curriculumHighlights.map(item => item.trim()) : null,
        updated_at: new Date().toISOString(),
      };

      if (!isInstructor) {
        updates.is_featured = isFeatured;
        updates.is_bestseller = isBestseller;
      }

      if (status === 'published') {
        if (!originalCourse?.published_at) {
          updates.published_at = new Date().toISOString();
        }
        if (visibility === 'private') {
          addToast('info', 'This course is private and will not appear in the public catalog.');
        }
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }

      if (originalCourse?.status === 'archived' && status !== 'archived') {
        updates.archived_at = null;
      }

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) {
        if (error.message?.includes('duplicate key') || error.message?.includes('courses_slug_key')) {
          setErrors({ slug: 'Course (Slug) Please review the information and try again..' });
          addToast('error', 'Please review the information and try again..');
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      if ((status === 'published') !== (originalCourse?.status === 'published')) {
        const { error: publicationError } = await supabase.rpc('admin_set_course_publication', { p_course_id: courseId, p_publish: status === 'published' });
        if (publicationError) throw publicationError;
      }

      await recordAdminAudit('update', 'course', courseId, { title: title.trim(), status, visibility });
      addToast('success', 'Course changes saved.');
      loadCourse();
    } catch (err: any) {
      console.error('Error updating course:', err);
      addToast('error', err.message || 'Save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-8">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/courses')}
                className="p-2 bg-white rounded-xl border border-primary-200 text-primary-600 hover:text-primary-900 transition-colors"
                title="Courses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Edit course</h1>
                <p className="text-primary-600 text-xs sm:text-sm">
                  Update.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/admin/courses/${courseId}/builder`)}
                className="bg-accent-50 hover:bg-accent-100 text-accent-800 border border-accent-200 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors"
              >
                <Sparkle className="w-4 h-4 text-accent-600" />
                <span>Open Course Builder</span>
              </button>

              <Button
                type="submit"
                form="edit-course-form"
                disabled={isSubmitting || isLoading}
                className="bg-accent-600 hover:bg-accent-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Save...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white border border-primary-200 rounded-2xl p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-accent-600 mx-auto mb-3" />
              <p className="text-primary-700 font-bold text-sm">Course...</p>
            </div>
          ) : errorMessage ? (
            /* Error State */
            <div className="bg-white border border-danger-200 rounded-2xl p-6 md:p-8 text-left shadow-xs">
              <div className="flex items-center gap-3 text-danger-600 mb-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold text-lg">Course</h3>
              </div>
              <p className="text-primary-700 text-sm mb-6">{errorMessage}</p>
              <button
                onClick={loadCourse}
                className="inline-flex items-center gap-2 bg-primary-900 text-white font-bold text-sm py-2.5 px-6 rounded-xl hover:bg-primary-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            /* Edit Form */
            <>
            <CourseEditorGuide steps={[
              { id: 'course-basics', label: 'Basics', description: 'Title and sales description', complete: Boolean(title.trim() && shortDescription.trim().length >= COURSE_SUMMARY_MIN_LENGTH && description.trim().length >= COURSE_DESCRIPTION_MIN_LENGTH) },
              { id: 'course-classification', label: 'Publishing', description: 'Status, catalog, and pricing', complete: Boolean(category && level && language && priceEgp && priceUsd) },
              { id: 'course-instructor', label: 'Instructor', description: 'Approved course owner', complete: Boolean(instructorId) },
              { id: 'course-media', label: 'Cover', description: 'One reusable course image', complete: Boolean(coverImage.trim()) },
            ]} />
            <form id="edit-course-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div id="course-basics" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent-600" />
                  <span>Publishing and Visibility</span>
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
                      className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm font-medium ${
                        errors.title ? 'border-danger-400 bg-danger-50/50' : 'border-primary-200'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-danger-600 font-bold mt-1.5">{errors.title}</p>
                    )}
                  </div>



                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Course summary <span className="text-danger-500">*</span></label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => { setShortDescription(e.target.value); if (errors.shortDescription) setErrors((prev) => ({ ...prev, shortDescription: '' })); }}
                      minLength={COURSE_SUMMARY_MIN_LENGTH}
                      required
                      aria-describedby="course-summary-help"
                      className={`w-full px-4 py-3 bg-primary-50 border rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm ${errors.shortDescription ? 'border-danger-400' : 'border-primary-200'}`}
                    />
                    <p id="course-summary-help" className={`mt-1.5 text-xs ${errors.shortDescription ? 'font-bold text-danger-600' : 'text-primary-500'}`}>{errors.shortDescription || `${shortDescription.trim().length}/${COURSE_SUMMARY_MIN_LENGTH} minimum characters required for review.`}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Full course description <span className="text-danger-500">*</span></label>
                    <RichTextEditor
                      value={description}
                      onChange={(html) => { setDescription(html); if (errors.description) setErrors((prev) => ({ ...prev, description: '' })); }}
                      error={Boolean(errors.description)}
                      ariaDescribedBy="course-description-help"
                    />
                    <p id="course-description-help" className={`mt-1.5 text-xs ${errors.description ? 'font-bold text-danger-600' : 'text-primary-500'}`}>{errors.description || `${richTextVisibleLength(description)}/${COURSE_DESCRIPTION_MIN_LENGTH} minimum characters required for review.`}</p>
                  </div>

                  <div className="grid gap-5">
                    <DynamicListEditor id="course-learning-outcomes" label="Learning outcomes" description="What learners will be able to do after completing this course. Items appear in this order on the course page." value={learningOutcomes} onChange={(items) => { setLearningOutcomes(items); if (errors.learningOutcomes) setErrors(current => ({ ...current, learningOutcomes: '' })); }} error={errors.learningOutcomes} />
                    <DynamicListEditor id="course-requirements" label="Requirements" description="Knowledge, materials, or experience learners should have before starting." value={requirements} onChange={(items) => { setRequirements(items); if (errors.requirements) setErrors(current => ({ ...current, requirements: '' })); }} error={errors.requirements} />
                    <DynamicListEditor id="course-target-audience" label="Target audience" description="The learners this course is designed for." value={targetAudience} onChange={(items) => { setTargetAudience(items); if (errors.targetAudience) setErrors(current => ({ ...current, targetAudience: '' })); }} error={errors.targetAudience} />
                    <DynamicListEditor id="course-curriculum-highlights" label="Catalog card highlights" description="Optional. Overrides the checkmark bullets shown on course cards. Leave empty to keep showing the two most relevant published lesson titles automatically." value={curriculumHighlights} onChange={(items) => { setCurriculumHighlights(items); if (errors.curriculumHighlights) setErrors(current => ({ ...current, curriculumHighlights: '' })); }} error={errors.curriculumHighlights} />
                  </div>
                </div>
              </div>

              {/* Status, Category & Pricing */}
              <div id="course-classification" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent-600" />
                  <span>Publish</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Course</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="draft">Draft (Draft)</option>
                      {!isInstructor && <option value="published">Published</option>}
                      {!isInstructor && <option value="archived">Archived</option>}
                    </select>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Course Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="public">Public (Course Catalog)</option>
                      <option value="unlisted">Unlisted (Direct Link)</option>
                      <option value="private">Private (Enrolled Students Only)</option>
                    </select>
                  </div>

                  <CategoryField value={category} onChange={setCategory} />

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm font-bold"
                    >
                      <option value="all_levels">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Egypt Price (EGP) *</label>
                    <input type="number" min="0" step="0.01" required value={priceEgp} onChange={(e) => setPriceEgp(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl" />
                    {errors.priceEgp && <p className="text-xs text-danger-600 mt-1">{errors.priceEgp}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">International Price (USD) *</label>
                    <input type="number" min="0" step="0.01" required value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl" />
                    {errors.priceUsd && <p className="text-xs text-danger-600 mt-1">{errors.priceUsd}</p>}
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all text-sm font-bold">{COURSE_LANGUAGES.map(item => <option key={item}>{item}</option>)}</select>
                  </div>

                  {/* Instructor */}
                  {!isInstructor && <div id="course-instructor" className="scroll-mt-24 md:col-span-2"><InstructorPicker value={instructorId} onChange={setInstructorId} /></div>}
                </div>
              </div>

              {/* Homepage and catalog curation, admin-only. */}
              {!isInstructor && (
                <div id="course-curation" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                  <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-600" />
                    <span>Catalog curation</span>
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-primary-50/50 border border-primary-200 rounded-xl">
                      <div>
                        <h4 className="flex items-center gap-1.5 font-bold text-primary-900 text-sm"><Sparkles className="w-4 h-4 text-info-600" />Featured</h4>
                        <p className="text-primary-500 text-xs mt-0.5">Shows a "Featured" badge on this course's card.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-none">
                        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="sr-only peer" aria-label="Featured" />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 bg-primary-50/50 border border-primary-200 rounded-xl">
                      <div>
                        <h4 className="flex items-center gap-1.5 font-bold text-primary-900 text-sm"><Flame className="w-4 h-4 text-warning-600" />Bestseller</h4>
                        <p className="text-primary-500 text-xs mt-0.5">Shows a "Bestseller" badge on this course's card.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-none">
                        <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} className="sr-only peer" aria-label="Bestseller" />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* One canonical cover reused by catalog and sales page. */}
              <div id="course-media" className="scroll-mt-24 bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs">
                <h2 className="text-xl font-bold text-primary-900 mb-6 pb-3 border-b border-primary-100 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-accent-600" /><span>Course media</span></h2>
                <CourseCoverUpload value={coverImage} onChange={setCoverImage} />
                <div className="mt-6 border-t border-primary-100 pt-6"><label htmlFor="course-trailer-video" className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-900"><Video className="h-4 w-4 text-accent-600" />Promotional trailer URL <span className="font-normal text-primary-500">(optional)</span></label><input id="course-trailer-video" type="url" value={trailerVideo} onChange={event => setTrailerVideo(event.target.value)} placeholder="Google Drive, YouTube, Vimeo, or direct video URL" className="min-h-12 w-full rounded-xl border border-primary-200 bg-primary-50 px-4 text-sm focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500" /><p className="mt-2 text-xs leading-relaxed text-primary-500">When empty, the sales page uses the published preview lesson. If neither is available, the cover remains a static image.</p></div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/courses')}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-6 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent-600 hover:bg-accent-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-xs text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Save...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
            </>
          )}
          </div>
        </PageContainer>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { recordAdminAudit } from '../../lib/adminAudit';
import {
  ArrowRight,
  Save,
  Loader2,
  AlertCircle,
  Video,
  FileText,
  FileCode,
  Volume2,
  ExternalLink,
  Code,
  Radio,
  HelpCircle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  Copy,
  Layers,
  Settings as SettingsIcon,
  Globe,
  Lock,
  Download,
  ShieldAlert,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Course, CourseSection, Lesson } from '../../types/database.types';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { LessonService } from '../../services/lesson.service';
import { sanitizeSlug } from './AdminCourseCreate';

type EditorTab = 'general' | 'content' | 'access' | 'settings';

export function AdminLessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [searchParams] = useSearchParams();
  const initialSectionId = searchParams.get('sectionId') || '';
  const rawParamType = searchParams.get('lessonType') || searchParams.get('type') || 'video';
  const initialType = (['quiz', 'assignment'].includes(rawParamType) ? 'video' : rawParamType) as any;

  const navigate = useNavigate();
  const isEditMode = Boolean(lessonId && lessonId !== 'new');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('general');

  // Loading & Saving
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parent Data
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [lessonType, setLessonType] = useState<
    'video' | 'article' | 'pdf' | 'audio' | 'embed' | 'external_link' | 'live' | 'quiz' | 'assignment'
  >(initialType);
  const [duration, setDuration] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  const [thumbnail, setThumbnail] = useState('');

  // Content specific
  const [videoUrl, setVideoUrl] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [content, setContent] = useState('');
  const [transcript, setTranscript] = useState('');
  const [captionsUrl, setCaptionsUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfAllowDownload, setPdfAllowDownload] = useState(true);
  const [pdfWatermark, setPdfWatermark] = useState(false);
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  // Access & Settings
  const [isPreview, setIsPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [completionRule, setCompletionRule] = useState<
    'manual' | 'watch90' | 'read_end' | 'pass_quiz' | 'upload_assignment'
  >('manual');
  const [orderIndex, setOrderIndex] = useState(0);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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

  // Load Data
  const loadData = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Fetch Course
      const { data: courseData, error: courseErr } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseErr) throw courseErr;
      setCourse(courseData);

      // Fetch Sections
      const { data: sectionsData, error: secErr } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (secErr) throw secErr;
      const loadedSections = sectionsData || [];
      setSections(loadedSections);

      // Set default section if not provided or if specified section doesn't belong to this course
      let currentSectionId = initialSectionId;
      if (currentSectionId && !loadedSections.some((s) => s.id === currentSectionId)) {
        console.warn('Selected sectionId does not belong to course:', courseId);
        currentSectionId = loadedSections[0]?.id || '';
        setSectionId(currentSectionId);
      } else if (!currentSectionId && loadedSections.length > 0) {
        currentSectionId = loadedSections[0].id;
        setSectionId(currentSectionId);
      }

      // Fetch Lesson if edit mode
      if (isEditMode && lessonId) {
        const lessonData = await LessonService.getLessonById(lessonId);
        if (!lessonData) {
          throw new Error('Lesson.');
        }

        setTitle(lessonData.title || '');
        setSlug(lessonData.slug || '');
        setDescription(lessonData.description || '');
        setSectionId(lessonData.section_id || currentSectionId);

        const type = (lessonData.lesson_type || lessonData.type || 'video') as any;
        setLessonType(
          ['video', 'article', 'pdf', 'audio', 'embed', 'external_link', 'live', 'quiz', 'assignment'].includes(type)
            ? type
            : type === 'text' ? 'article' : 'video'
        );

        setDuration(lessonData.duration || '');
        setEstimatedMinutes(lessonData.estimated_minutes ?? 0);
        setThumbnail(lessonData.thumbnail || '');
        setVideoUrl(lessonData.video_url || '');
        setContentUrl(lessonData.content_url || '');
        setContent(lessonData.content || '');
        setTranscript(lessonData.transcript || '');
        setCaptionsUrl(lessonData.captions_url || '');
        setNotes(lessonData.notes || '');
        setPdfAllowDownload(lessonData.pdf_allow_download ?? true);
        setPdfWatermark(lessonData.pdf_watermark ?? false);
        setOpenInNewTab(lessonData.open_in_new_tab ?? false);
        setEmbedCode(lessonData.embed_code || '');

        setIsPreview(Boolean(lessonData.is_preview));
        setIsPublished(Boolean(lessonData.is_published));
        setCompletionRule((lessonData.completion_rule as any) || 'manual');
        setOrderIndex(lessonData.order_index ?? 0);
        setSeoTitle(lessonData.seo_title || '');
        setSeoDescription(lessonData.seo_description || '');
      } else {
        // New Lesson Defaults
        if (currentSectionId) {
          const sectionLessons = await LessonService.getLessonsBySection(currentSectionId);
          setOrderIndex(sectionLessons.length > 0 ? Math.max(...sectionLessons.map((l) => l.order_index)) + 1 : 0);
        }
      }
    } catch (err: any) {
      console.error('Error loading lesson editor data:', err);
      setErrorMessage(err.message || 'Unable to complete this action.');
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  }, [courseId, lessonId, isEditMode, initialSectionId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, [loadData]);

  // Unsaved changes warning on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Generate Slug
  const handleGenerateSlug = () => {
    if (!title.trim()) return;
    const cleanSlug = sanitizeSlug(title);
    setSlug(cleanSlug);
    setIsDirty(true);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
  };

  // Submit Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courseId || isSaving) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Lesson';
    }
    if (estimatedMinutes < 0) {
      newErrors.estimatedMinutes = 'Duration must be greater than zero.';
    }

    // URL validation if type demands URL
    if (['video'].includes(lessonType) && videoUrl.trim() && !videoUrl.trim().startsWith('http')) {
      newErrors.videoUrl = 'Enter a valid URL beginning with http:// or https://.';
    }
    if (['pdf', 'audio', 'external_link'].includes(lessonType) && contentUrl.trim() && !contentUrl.trim().startsWith('http')) {
      newErrors.contentUrl = 'Enter a valid URL beginning with http:// or https://.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Save.');
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const cleanSlug = slug.trim() ? sanitizeSlug(slug) : sanitizeSlug(title);

      const payload: Partial<Lesson> = {
        course_id: courseId,
        section_id: sectionId || null,
        title: title.trim(),
        slug: cleanSlug || null,
        description: description.trim() || null,
        lesson_type: lessonType,
        type: lessonType === 'article' || lessonType === 'pdf' ? 'text' : lessonType === 'quiz' ? 'quiz' : 'video',
        duration: (typeof duration === 'string' ? duration.trim() : typeof duration === 'number' ? String(duration) : '') || (estimatedMinutes ? `${estimatedMinutes} Minute` : null),
        estimated_minutes: estimatedMinutes,
        thumbnail: thumbnail.trim() || null,
        video_url: videoUrl.trim() || null,
        content_url: contentUrl.trim() || null,
        content: content || null,
        transcript: transcript || null,
        captions_url: captionsUrl.trim() || null,
        notes: notes || null,
        pdf_allow_download: pdfAllowDownload,
        pdf_watermark: pdfWatermark,
        open_in_new_tab: openInNewTab,
        embed_code: embedCode || null,
        is_preview: isPreview,
        is_published: isPublished,
        completion_rule: completionRule,
        order_index: orderIndex,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      };

      if (isEditMode && lessonId) {
        await LessonService.updateLesson(lessonId, payload);
        addToast('success', 'Save!');
      } else {
        const newLesson = await LessonService.createLesson(payload);
        addToast('success', 'Create!');
        setIsDirty(false);
        setTimeout(() => {
          navigate(`/admin/courses/${courseId}/lessons/${newLesson.id}/edit`, { replace: true });
        }, 500);
        return;
      }

      setIsDirty(false);
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      addToast('error', err.message || 'Save.');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Handler
  const handleDuplicate = async () => {
    if (!lessonId || !isEditMode) return;
    try {
      setIsSaving(true);
      const copy = await LessonService.duplicateLesson(lessonId);
      addToast('success', 'Lesson!');
      setTimeout(() => {
        navigate(`/admin/courses/${courseId}/lessons/${copy.id}/edit`);
      }, 500);
    } catch (err: any) {
      console.error('Error duplicating lesson:', err);
      addToast('error', 'Lesson.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!lessonId || !isEditMode) return;
    try {
      setIsSaving(true);
      await LessonService.deleteLesson(lessonId, sectionId);
      await recordAdminAudit('delete', 'lesson', lessonId, { courseId, sectionId });
      addToast('success', 'Lesson deleted.');
      navigate(`/admin/courses/${courseId}/builder`);
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      addToast('error', 'The lesson could not be deleted.');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-amber-600" />;
      case 'article': return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'pdf': return <FileCode className="w-4 h-4 text-red-600" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-purple-600" />;
      case 'external_link': return <ExternalLink className="w-4 h-4 text-blue-600" />;
      case 'embed': return <Code className="w-4 h-4 text-indigo-600" />;
      case 'live': return <Radio className="w-4 h-4 text-rose-600" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'assignment': return <ClipboardCheck className="w-4 h-4 text-teal-600" />;
      default: return <Video className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main id="main-content" className="lg:pl-72 pt-6 pb-24 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-primary-200 p-5 md:p-6 shadow-2xs mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Navigation Back & Title */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isDirty) { setShowLeaveConfirm(true); return; }
                    navigate(`/admin/courses/${courseId}/builder`);
                  }}
                  className="p-2.5 bg-primary-50 hover:bg-primary-100 rounded-xl border border-primary-200 text-primary-600 transition-colors"
                  title="Back Course Builder"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      {getLessonTypeIcon(lessonType)}
                      <span>Lessons</span>
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </span>

                    {isPreview && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Free
                      </span>
                    )}

                    {isDirty && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        Lesson settings
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-primary-900 leading-tight">
                    {title || (isEditMode ? 'Edit' : 'Add')}
                  </h1>
                  <p className="text-primary-500 text-xs mt-0.5">
                    Course: <span className="font-bold text-primary-800">{course?.title || 'Loading......'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                {isEditMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      disabled={isSaving}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 font-bold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                      title="Lesson"
                    >
                      <Copy className="w-4 h-4 text-primary-600" />
                      <span className="hidden sm:inline">Duplicate lesson</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSaving}
                      className="bg-danger-50 hover:bg-danger-100 text-danger-700 border border-danger-200 font-bold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </>
                )}

                <Button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Save...' : 'Save'}</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-primary-100 overflow-x-auto no-scrollbar text-sm font-bold">
              {[
                { id: 'general', label: 'General', icon: SettingsIcon },
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'access', label: 'Access', icon: Lock },
                { id: 'settings', label: 'Access & settings', icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as EditorTab)}
                    className={`flex items-center gap-2 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-primary-600 hover:bg-primary-100 hover:text-primary-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Body per Active Tab */}
          {isLoading ? (
            <div className="bg-white border border-primary-200 rounded-2xl p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-primary-700 font-bold text-sm">Loading...</p>
            </div>
          ) : errorMessage ? (
            <div className="bg-white border border-danger-200 rounded-2xl p-6 text-left shadow-xs">
              <div className="flex items-center gap-3 text-danger-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Error</h3>
              </div>
              <p className="text-primary-700 text-sm mb-4">{errorMessage}</p>
              <button
                type="button"
                onClick={loadData}
                className="bg-primary-900 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-primary-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-2xs space-y-6">
                  <h3 className="text-lg font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-amber-600" />
                    <span>Lesson</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setIsDirty(true);
                          if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                        }}
                        placeholder="Enter a clear lesson title"
                        className={`w-full px-4 py-2.5 bg-white border ${
                          errors.title ? 'border-danger-500' : 'border-primary-200'
                        } rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium`}
                      />
                      {errors.title && <p className="text-danger-600 text-xs font-bold mt-1">{errors.title}</p>}
                    </div>

                    {/* Slug */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-primary-900">
                          Lesson (Slug)
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSlug}
                          className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Lesson settings</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="lesson-slug-example"
                        dir="ltr"
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium text-left"
                      />
                    </div>

                    {/* Section Selector */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Section (Section)
                      </label>
                      <select
                        value={sectionId}
                        onChange={(e) => {
                          setSectionId(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      >
                        {sections.map((sec, idx) => (
                          <option key={sec.id} value={sec.id}>
                            Section {idx + 1}: {sec.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lesson Type */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Content
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                          { id: 'video', label: 'Video', icon: Video, color: 'text-amber-600' },
                          { id: 'article', label: 'Article', icon: FileText, color: 'text-emerald-600' },
                          { id: 'pdf', label: 'PDF Document', icon: FileCode, color: 'text-red-600' },
                          { id: 'audio', label: 'Audio', icon: Volume2, color: 'text-purple-600' },
                          { id: 'external_link', label: 'Link', icon: ExternalLink, color: 'text-blue-600' },
                          { id: 'embed', label: 'Embedded Content', icon: Code, color: 'text-indigo-600' },
                          { id: 'live', label: 'Live Session', icon: Radio, color: 'text-rose-600' },
                          { id: 'quiz', label: 'Quiz Quiz', icon: HelpCircle, color: 'text-amber-600' },
                          { id: 'assignment', label: 'Assignment', icon: ClipboardCheck, color: 'text-teal-600' },
                        ].map((typeItem) => {
                          const Icon = typeItem.icon;
                          const isSelected = lessonType === typeItem.id;
                          return (
                            <button
                              key={typeItem.id}
                              type="button"
                              onClick={() => {
                                setLessonType(typeItem.id as any);
                                setIsDirty(true);
                              }}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                                isSelected
                                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                                  : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${typeItem.color}`} />
                              <span className="text-xs">{typeItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Duration (Lesson settings)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={estimatedMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEstimatedMinutes(val);
                          setDuration(`${val} Minute`);
                          setIsDirty(true);
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson (Thumbnail)
                      </label>
                      <input
                        type="url"
                        value={thumbnail}
                        onChange={(e) => {
                          setThumbnail(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="https://example.com/thumb.jpg"
                        dir="ltr"
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium text-left"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Lesson..."
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-2xs space-y-6">
                  <h3 className="text-lg font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    {getLessonTypeIcon(lessonType)}
                    <span>Content — {lessonType.toUpperCase()}</span>
                  </h3>

                  {/* Video Content Fields */}
                  {lessonType === 'video' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Link (YouTube, Vimeo, MP4, HLS) *
                        </label>
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => {
                            setVideoUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium text-left"
                        />
                        {errors.videoUrl && <p className="text-danger-600 text-xs font-bold mt-1">{errors.videoUrl}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Transcript
                        </label>
                        <textarea
                          rows={4}
                          value={transcript}
                          onChange={(e) => {
                            setTranscript(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="Add a transcript or lesson notes..."
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-primary-900 mb-2">
                            Link (VTT / Captions)
                          </label>
                          <input
                            type="url"
                            value={captionsUrl}
                            onChange={(e) => {
                              setCaptionsUrl(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="https://example.com/subtitles.vtt"
                            dir="ltr"
                            className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-primary-900 mb-2">
                            Lesson settings
                          </label>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => {
                              setNotes(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="Enter details..."
                            className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Article Content Fields */}
                  {lessonType === 'article' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Content
                        </label>
                        <textarea
                          rows={12}
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="Enter the lesson article content..."
                          className="w-full p-4 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF Content Fields */}
                  {lessonType === 'pdf' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Link PDF *
                        </label>
                        <input
                          type="url"
                          value={contentUrl}
                          onChange={(e) => {
                            setContentUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://example.com/document.pdf"
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-left"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary-900">
                          <input
                            type="checkbox"
                            checked={pdfAllowDownload}
                            onChange={(e) => {
                              setPdfAllowDownload(e.target.checked);
                              setIsDirty(true);
                            }}
                            className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                          />
                          <span>Lesson settings</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary-900">
                          <input
                            type="checkbox"
                            checked={pdfWatermark}
                            onChange={(e) => {
                              setPdfWatermark(e.target.checked);
                              setIsDirty(true);
                            }}
                            className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                          />
                          <span>Lesson settings</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Audio Content Fields */}
                  {lessonType === 'audio' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Link (MP3, WAV, Podcast URL) *
                        </label>
                        <input
                          type="url"
                          value={contentUrl}
                          onChange={(e) => {
                            setContentUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://example.com/audio.mp3"
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-left"
                        />
                      </div>
                    </div>
                  )}

                  {/* External Link Fields */}
                  {lessonType === 'external_link' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Link (External URL) *
                        </label>
                        <input
                          type="url"
                          value={contentUrl}
                          onChange={(e) => {
                            setContentUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://github.com/example/repo"
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-left"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary-900">
                        <input
                          type="checkbox"
                          checked={openInNewTab}
                          onChange={(e) => {
                            setOpenInNewTab(e.target.checked);
                            setIsDirty(true);
                          }}
                          className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                        />
                        <span>Link (New Tab)</span>
                      </label>
                    </div>
                  )}

                  {/* Embed Content Fields */}
                  {lessonType === 'embed' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Embed HTML or iframe
                        </label>
                        <textarea
                          rows={6}
                          value={embedCode}
                          onChange={(e) => {
                            setEmbedCode(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder='<iframe src="https://..." width="100%" height="400"></iframe>'
                          dir="ltr"
                          className="w-full p-3 bg-white border border-primary-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Stream / Meeting Fields */}
                  {lessonType === 'live' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Link (Zoom, Google Meet, YouTube Live)
                        </label>
                        <input
                          type="url"
                          value={contentUrl}
                          onChange={(e) => {
                            setContentUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://zoom.us/j/123456789"
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-left"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quiz Notification */}
                  {lessonType === 'quiz' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed space-y-2">
                      <p className="font-bold">Review the quiz information and continue when you are ready.:</p>
                      <p>
                        Lesson (Quiz). Review the quiz information and continue when you are ready. (Quiz Builder).
                      </p>
                    </div>
                  )}

                  {/* Assignment Notification */}
                  {lessonType === 'assignment' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Students
                        </label>
                        <textarea
                          rows={6}
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="Enter details..."
                          className="w-full p-4 bg-white border border-primary-200 rounded-xl text-sm font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACCESS */}
              {activeTab === 'access' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-2xs space-y-6">
                  <h3 className="text-lg font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <span>Publish</span>
                  </h3>

                  <div className="space-y-6">
                    {/* Published Toggle */}
                    <div className="flex items-center justify-between p-4 bg-primary-50/50 border border-primary-200 rounded-xl">
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm">Publish</h4>
                        <p className="text-primary-500 text-xs mt-0.5">
                          Publish.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(e) => {
                            setIsPublished(e.target.checked);
                            setIsDirty(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* Free Preview Toggle */}
                    <div className="flex items-center justify-between p-4 bg-primary-50/50 border border-primary-200 rounded-xl">
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm">Free (Free Preview)</h4>
                        <p className="text-primary-500 text-xs mt-0.5">
                          The requested information could not be loaded. Please try again.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPreview}
                          onChange={(e) => {
                            setIsPreview(e.target.checked);
                            setIsDirty(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Completion Rule */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson (Completion Rule)
                      </label>
                      <select
                        value={completionRule}
                        onChange={(e) => {
                          setCompletionRule(e.target.value as any);
                          setIsDirty(true);
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      >
                        <option value="manual">Confirm</option>
                        <option value="watch90">Watch 90% of video</option>
                        <option value="read_end">Content</option>
                        <option value="pass_quiz">Lesson</option>
                        <option value="upload_assignment">Lesson settings</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-2xs space-y-6">
                  <h3 className="text-lg font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-600" />
                    <span>Search metadata (SEO)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Index */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson (Order Index)
                      </label>
                      <input
                        type="number"
                        value={orderIndex}
                        onChange={(e) => {
                          setOrderIndex(parseInt(e.target.value) || 0);
                          setIsDirty(true);
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium"
                      />
                    </div>

                    {/* SEO Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        SEO title
                      </label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => {
                          setSeoTitle(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Search..."
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium"
                      />
                    </div>

                    {/* SEO Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        SEO description
                      </label>
                      <textarea
                        rows={3}
                        value={seoDescription}
                        onChange={(e) => {
                          setSeoDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Search..."
                        className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </main>

      <ConfirmDialog open={showDeleteConfirm} title="Delete lesson?" description={`“${title || 'Untitled lesson'}” will be permanently removed. This action cannot be undone.`} busy={isSaving} onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} />
      <ConfirmDialog open={showLeaveConfirm} title="Discard unsaved changes?" description="Your changes to this lesson have not been saved." confirmLabel="Discard changes" onCancel={() => setShowLeaveConfirm(false)} onConfirm={() => navigate(`/admin/courses/${courseId}/builder`)} />
    </div>
  );
}

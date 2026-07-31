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
  ExternalLink,
  HelpCircle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  Copy,
  Layers,
  Settings as SettingsIcon,
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
import { defaultCompletionRule, isLessonContentType, LessonContentType } from '../../domain/courseAuthoring';
import { MediaService, PdfMetadataResult, VideoMetadataResult } from '../../services/media.service';
import { QuizBuilder } from '../../components/admin/quiz/QuizBuilder';
import { AssignmentBuilder } from '../../components/admin/assignment/AssignmentBuilder';
import { isGoogleDriveFileUrl } from '../../domain/videoUrl';

type EditorTab = 'general' | 'content' | 'access';

export function AdminLessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [searchParams] = useSearchParams();
  const initialSectionId = searchParams.get('sectionId') || '';
  const rawParamType = searchParams.get('lessonType') || searchParams.get('type') || 'video';
  const initialType: LessonContentType = isLessonContentType(rawParamType) ? rawParamType : 'video';

  const navigate = useNavigate();
  const isEditMode = Boolean(lessonId && lessonId !== 'new');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>(() => searchParams.get('tab') === 'content' ? 'content' : 'general');

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
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [lessonType, setLessonType] = useState<LessonContentType>(initialType);

  // Content specific
  const [videoUrl, setVideoUrl] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [captionsUrl, setCaptionsUrl] = useState('');
  const [pdfAllowDownload, setPdfAllowDownload] = useState(true);
  const [pdfWatermark, setPdfWatermark] = useState(false);
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // Access & Settings
  const [isPreview, setIsPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadataResult | null>(null);
  const [videoMetadataState, setVideoMetadataState] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'error'>('idle');
  const [pdfMetadata, setPdfMetadata] = useState<PdfMetadataResult | null>(null);
  const [pdfMetadataState, setPdfMetadataState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [pdfMetadataError, setPdfMetadataError] = useState<string | null>(null);

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
        setDescription(lessonData.description || '');
        setSectionId(lessonData.section_id || currentSectionId);

        const type = lessonData.content_type || lessonData.lesson_type || lessonData.type;
        if (!isLessonContentType(type)) {
          throw new Error('This legacy lesson type must be migrated before it can be edited.');
        }
        setLessonType(type);

        setVideoUrl(lessonData.video_url || '');
        setContentUrl(lessonData.content_url || '');
        setTranscript(lessonData.transcript || '');
        setCaptionsUrl(lessonData.captions_url || '');
        setPdfAllowDownload(lessonData.pdf_allow_download ?? true);
        setPdfWatermark(lessonData.pdf_watermark ?? false);
        setOpenInNewTab(lessonData.open_in_new_tab ?? false);

        setIsPreview(Boolean(lessonData.is_preview));
        setIsPublished(Boolean(lessonData.is_published));
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

  const inspectVideoMetadata = useCallback(async () => {
    if (lessonType !== 'video' || !videoUrl.trim()) return;
    setVideoMetadataState('loading');
    try {
      const result = await MediaService.inspectVideo(videoUrl.trim());
      setVideoMetadata(result);
      setVideoMetadataState(result.status);
    } catch {
      if (isGoogleDriveFileUrl(videoUrl.trim())) {
        setVideoMetadata({ provider: 'google_drive', durationSeconds: null, status: 'unavailable' });
        setVideoMetadataState('unavailable');
      } else {
        setVideoMetadata(null);
        setVideoMetadataState('error');
      }
    }
  }, [lessonType, videoUrl]);

  useEffect(() => {
    if (lessonType !== 'video' || !videoUrl.trim()) { setVideoMetadata(null); setVideoMetadataState('idle'); return; }
    const timeout = window.setTimeout(() => { void inspectVideoMetadata(); }, 700);
    return () => window.clearTimeout(timeout);
  }, [inspectVideoMetadata, lessonType, videoUrl]);

  const inspectPdfMetadata = useCallback(async () => {
    if (lessonType !== 'pdf' || !contentUrl.trim()) return;
    setPdfMetadataState('loading');
    setPdfMetadataError(null);
    try {
      const result = await MediaService.inspectPdf(contentUrl.trim());
      setPdfMetadata(result);
      setPdfMetadataState('ready');
    } catch (cause) {
      setPdfMetadata(null);
      setPdfMetadataState('error');
      setPdfMetadataError(cause instanceof Error ? cause.message : 'PDF metadata could not be loaded.');
    }
  }, [contentUrl, lessonType]);

  useEffect(() => {
    if (lessonType !== 'pdf' || !contentUrl.trim()) {
      setPdfMetadata(null);
      setPdfMetadataState('idle');
      setPdfMetadataError(null);
      return;
    }
    const timeout = window.setTimeout(() => { void inspectPdfMetadata(); }, 700);
    return () => window.clearTimeout(timeout);
  }, [contentUrl, inspectPdfMetadata, lessonType]);

  // Submit Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courseId || isSaving) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Lesson';
    }
    // URL validation if type demands URL
    if (['video'].includes(lessonType) && videoUrl.trim() && !videoUrl.trim().startsWith('http')) {
      newErrors.videoUrl = 'Enter a valid URL beginning with http:// or https://.';
    }
    if (['pdf', 'audio', 'external_link'].includes(lessonType) && contentUrl.trim() && !contentUrl.trim().startsWith('http')) {
      newErrors.contentUrl = 'Enter a valid URL beginning with http:// or https://.';
    }
    if (lessonType === 'pdf' && !contentUrl.trim()) {
      newErrors.contentUrl = 'Add a Google Drive PDF file link.';
    } else if (lessonType === 'pdf' && isPublished && pdfMetadataState !== 'ready') {
      newErrors.contentUrl = 'Verify that the service account can read this PDF before publishing the lesson.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('error', 'Save.');
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const payload: Partial<Lesson> = {
        course_id: courseId,
        section_id: sectionId || null,
        title: title.trim(),
        description: description.trim() || null,
        lesson_type: lessonType,
        content_type: lessonType,
        type: lessonType === 'pdf' || lessonType === 'external_link' ? 'text' : lessonType === 'quiz' ? 'quiz' : 'video',
        video_url: videoUrl.trim() || null,
        content_url: contentUrl.trim() || null,
        transcript: transcript || null,
        captions_url: captionsUrl.trim() || null,
        pdf_allow_download: pdfAllowDownload,
        pdf_watermark: pdfWatermark,
        open_in_new_tab: openInNewTab,
        is_preview: isPreview,
        is_published: isPublished,
        completion_rule: defaultCompletionRule(lessonType),
      };

      let savedLesson: Lesson;
      if (isEditMode && lessonId) {
        savedLesson = await LessonService.updateLesson(lessonId, payload);
      } else {
        savedLesson = await LessonService.createLesson(payload);
      }

      if (lessonType === 'video' && videoUrl.trim()) {
        const metadataToPersist: VideoMetadataResult = videoMetadata || { provider: 'unknown', durationSeconds: null, status: videoMetadataState === 'loading' ? 'pending' : 'failed' };
        await MediaService.persistVideoMetadata(savedLesson.id, videoUrl.trim(), metadataToPersist);
      }

      addToast('success', isEditMode ? 'Lesson saved.' : 'Lesson created.');

      setIsDirty(false);
      if (!isEditMode) {
        setActiveTab('content');
        setTimeout(() => navigate(`/admin/courses/${courseId}/lessons/${savedLesson.id}/edit?tab=content`, { replace: true }), 500);
      }
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
      case 'pdf': return <FileCode className="w-4 h-4 text-red-600" />;
      case 'external_link': return <ExternalLink className="w-4 h-4 text-blue-600" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'assignment': return <ClipboardCheck className="w-4 h-4 text-teal-600" />;
      default: return <Video className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-6">
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
                      <span>{lessonType.replaceAll('_', ' ')}</span>
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
                        Unsaved changes
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



                    {/* Section Selector */}
                    <div>
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Section
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
                        Lesson type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                          { id: 'video', label: 'Video', icon: Video, color: 'text-amber-600' },
                          { id: 'pdf', label: 'PDF document', icon: FileCode, color: 'text-red-600' },
                          { id: 'external_link', label: 'External link', icon: ExternalLink, color: 'text-blue-600' },
                          { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-amber-600' },
                          { id: 'assignment', label: 'Assignment', icon: ClipboardCheck, color: 'text-teal-600' },
                        ].map((typeItem) => {
                          const Icon = typeItem.icon;
                          const isSelected = lessonType === typeItem.id;
                          return (
                            <button
                              key={typeItem.id}
                              type="button"
                              onClick={() => {
                                const nextType = typeItem.id as LessonContentType;
                                setLessonType(nextType);
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

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-primary-900 mb-2">
                        Lesson description (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Briefly explain what students will learn."
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
                    <span>{lessonType.replaceAll('_', ' ')} content</span>
                  </h3>

                  {/* Video Content Fields */}
                  {lessonType === 'video' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          Video link *
                        </label>
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => {
                            setVideoUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="YouTube, Vimeo, Google Drive video file, MP4, or HLS URL"
                          dir="ltr"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium text-left"
                        />
                        {errors.videoUrl && <p className="text-danger-600 text-xs font-bold mt-1">{errors.videoUrl}</p>}
                        {videoMetadataState === 'loading' && <p role="status" className="mt-2 flex items-center gap-2 text-xs font-bold text-primary-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Detecting video duration…</p>}
                        {videoMetadataState === 'ready' && videoMetadata?.durationSeconds && <p className="mt-2 text-xs font-bold text-success-700">Duration detected automatically: {Math.ceil(videoMetadata.durationSeconds / 60)} min</p>}
                        {videoMetadataState === 'unavailable' && <div role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p className="font-bold">Video duration could not be verified.</p><p className="mt-1">You can save this as a draft, but the lesson will block course review until verification succeeds. Check the sharing permissions and provider link, then retry.</p><button type="button" onClick={() => void inspectVideoMetadata()} className="mt-3 min-h-11 rounded-lg border border-amber-300 px-4 font-bold">Retry verification</button></div>}
                        {videoMetadataState === 'error' && <div role="alert" className="mt-3 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700"><p className="font-bold">This video URL could not be verified. Check the provider and URL.</p><button type="button" onClick={() => void inspectVideoMetadata()} className="mt-3 min-h-11 rounded-lg border border-danger-300 px-4 font-bold">Retry verification</button></div>}
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
                            Captions URL (VTT)
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


                      </div>
                    </div>
                  )}

                  {/* PDF Content Fields */}
                  {lessonType === 'pdf' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          PDF URL *
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
                        {errors.contentUrl && <p role="alert" className="mt-2 text-sm font-semibold text-danger-700">{errors.contentUrl}</p>}
                        {pdfMetadataState === 'loading' && (
                          <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Verifying service-account access…</p>
                        )}
                        {pdfMetadataState === 'ready' && pdfMetadata && (
                          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-success-700"><CheckCircle className="h-4 w-4" aria-hidden="true" /> PDF verified: {pdfMetadata.name}</p>
                        )}
                        {pdfMetadataState === 'error' && (
                          <div role="alert" className="mt-3 rounded-xl border border-warning-300 bg-warning-50 p-4 text-sm text-warning-900">
                            <p className="font-bold">PDF access could not be verified.</p>
                            <p className="mt-1">{pdfMetadataError}</p>
                            <button type="button" onClick={() => void inspectPdfMetadata()} className="mt-3 min-h-11 rounded-lg border border-warning-400 bg-white px-4 font-bold">Retry verification</button>
                          </div>
                        )}
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
                          <span>Allow students to download this PDF</span>
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
                          <span>Apply the configured PDF watermark</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* External Link Fields */}
                  {lessonType === 'external_link' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-2">
                          External resource URL *
                        </label>
                        <input
                          type="url"
                          value={contentUrl}
                          onChange={(e) => {
                            setContentUrl(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="https://example.com/resource"
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
                        <span>Open this resource in a new tab</span>
                      </label>
                    </div>
                  )}

                  {/* Quiz Notification */}
                  {lessonType === 'quiz' && (
                    isEditMode && lessonId
                      ? <QuizBuilder lessonId={lessonId} lessonTitle={title} />
                      : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Save the lesson to open the quiz builder.</p><p className="mt-1">Questions, correct answers, pass score, and retry limits are configured after the lesson has been created.</p></div>
                  )}

                  {/* Assignment Notification */}
                  {lessonType === 'assignment' && (
                    isEditMode && lessonId ? <AssignmentBuilder lessonId={lessonId} /> : <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm"><p className="font-bold">Save the lesson to open the assignment builder.</p><p className="mt-1">Instructions, deadlines, grading points, and response format are configured after creation.</p></div>
                  )}
                </div>
              )}

              {/* TAB 3: ACCESS */}
              {activeTab === 'access' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-2xs space-y-6">
                  <h3 className="text-lg font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <span>Student access</span>
                  </h3>

                  <div className="space-y-6">
                    {/* Published Toggle */}
                    <div className="flex items-center justify-between p-4 bg-primary-50/50 border border-primary-200 rounded-xl">
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm">Available in the course</h4>
                        <p className="text-primary-500 text-xs mt-0.5">
                          Students can open this lesson after the course is approved and published.
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
                        <h4 className="font-bold text-primary-900 text-sm">Free preview lesson</h4>
                        <p className="text-primary-500 text-xs mt-0.5">
                          Allow visitors to preview this lesson before enrollment.
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

                  </div>
                </div>
              )}

            </form>
          )}
        </div>
      </main>

      <ConfirmDialog open={showDeleteConfirm} title="Delete lesson?" description={`“${title || 'Untitled lesson'}” will be permanently removed. This action cannot be undone.`} busy={isSaving} onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} />
      <ConfirmDialog open={showLeaveConfirm} title="Discard unsaved changes?" description="Your changes to this lesson have not been saved." confirmLabel="Discard changes" cancelLabel="Keep editing" onCancel={() => setShowLeaveConfirm(false)} onConfirm={() => navigate(`/admin/courses/${courseId}/builder`)} />
    </div>
  );
}

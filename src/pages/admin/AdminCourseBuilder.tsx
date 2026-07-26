import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  ArrowRight,
  Eye,
  Settings,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Video,
  HelpCircle,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  Globe,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  PlayCircle,
  Clock,
  BookOpen,
  GripVertical,
  Copy,
  FileCode,
  Volume2,
  ExternalLink,
  Code,
  Radio,
  ClipboardCheck,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Course, CourseSection, Lesson } from '../../types/database.types';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { LessonService } from '../../services/lesson.service';
import { CurriculumBuilder } from '../../components/admin/curriculum/CurriculumBuilder';

type TabType = 'curriculum' | 'settings' | 'pricing' | 'seo' | 'publish';

export function AdminCourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('curriculum');

  // Course State
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Form States
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  const [isAddLessonOpen, setIsAddLessonOpen] = useState<string | null>(null); // sectionId
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'video' | 'text' | 'quiz'>('video');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonPreview, setNewLessonPreview] = useState(false);

  // SEO Form Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // Pricing Form Fields
  const [priceEgp, setPriceEgp] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [dripEnabled, setDripEnabled] = useState(false);
  const [sequentialLearning, setSequentialLearning] = useState(false);
  const [certificateEnabled, setCertificateEnabled] = useState(true);

  // Toasts
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

  // Fetch Course, Sections, Lessons
  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Fetch course
      const { data: courseData, error: courseErr } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseErr) throw courseErr;
      setCourse(courseData);

      // Populate SEO and Pricing fields
      setSeoTitle(courseData.seo_title || '');
      setSeoDescription(courseData.seo_description || '');
      setSeoKeywords(courseData.seo_keywords || '');
      setPriceEgp(courseData.price_egp == null ? '' : String(courseData.price_egp));
      setPriceUsd(courseData.price_usd == null ? '' : String(courseData.price_usd));
      setDripEnabled(Boolean(courseData.drip_enabled));
      setSequentialLearning(Boolean(courseData.sequential_learning));
      setCertificateEnabled(
        courseData.certificate_enabled !== null ? Boolean(courseData.certificate_enabled) : true
      );

      // Fetch sections
      const { data: sectionsData, error: secErr } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (secErr) throw secErr;
      setSections(sectionsData || []);

      // Fetch lessons
      const { data: lessonsData, error: lesErr } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lesErr) throw lesErr;
      setLessons(lessonsData || []);
    } catch (err: any) {
      console.error('Error loading course builder details:', err);
      setErrorMessage(err.message || 'Error Course Builder.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Section CRUD
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !newSectionTitle.trim()) return;

    try {
      setIsSaving(true);
      const nextOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0;

      const { data, error } = await supabase
        .from('course_sections')
        .insert({
          course_id: courseId,
          title: newSectionTitle.trim(),
          order_index: nextOrder,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSections((prev) => [...prev, data]);
      setNewSectionTitle('');
      setIsAddSectionOpen(false);
      addToast('success', 'Add');
    } catch (err: any) {
      console.error('Error adding section:', err);
      addToast('error', err.message || 'Add.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string) => {
    if (!editingSectionTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('course_sections')
        .update({ title: editingSectionTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', sectionId);

      if (error) throw error;

      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title: editingSectionTitle.trim() } : s))
      );
      setEditingSectionId(null);
      addToast('success', 'Update');
    } catch (err: any) {
      console.error('Error updating section:', err);
      addToast('error', 'Update.');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Delete')) return;

    try {
      // Delete lessons in section first
      await supabase.from('lessons').delete().eq('section_id', sectionId);

      // Delete section
      const { error } = await supabase.from('course_sections').delete().eq('id', sectionId);
      if (error) throw error;

      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setLessons((prev) => prev.filter((l) => l.section_id !== sectionId));
      addToast('success', 'Delete');
    } catch (err: any) {
      console.error('Error deleting section:', err);
      addToast('error', 'Delete.');
    }
  };

  // Lesson CRUD & Helpers
  const getLessonTypeIcon = (type?: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'article':
      case 'text':
        return <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'pdf':
        return <FileCode className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case 'audio':
        return <Volume2 className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      case 'external_link':
        return <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case 'embed':
        return <Code className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
      case 'live':
        return <Radio className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'assignment':
        return <ClipboardCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />;
      default:
        return <Video className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    }
  };

  const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!courseId || !newLessonTitle.trim()) return;

    try {
      setIsSaving(true);
      const sectionLessons = lessons.filter((l) => l.section_id === sectionId);
      const nextOrder = sectionLessons.length > 0 ? Math.max(...sectionLessons.map((l) => l.order_index)) + 1 : 0;

      const createdLesson = await LessonService.createLesson({
        course_id: courseId,
        section_id: sectionId,
        title: newLessonTitle.trim(),
        lesson_type: newLessonType,
        type: newLessonType,
        video_url: newLessonUrl.trim() || null,
        duration: typeof newLessonDuration === 'string' ? newLessonDuration.trim() || null : typeof newLessonDuration === 'number' ? String(newLessonDuration) : null,
        is_preview: newLessonPreview,
        is_published: true,
        order_index: nextOrder,
      });

      setLessons((prev) => [...prev, createdLesson]);
      setNewLessonTitle('');
      setNewLessonUrl('');
      setNewLessonDuration('');
      setNewLessonPreview(false);
      setIsAddLessonOpen(null);
      addToast('success', 'Add');
    } catch (err: any) {
      console.error('Error adding lesson:', err);
      addToast('error', err.message || 'Add.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateLesson = async (lessonId: string) => {
    try {
      setIsSaving(true);
      const duplicated = await LessonService.duplicateLesson(lessonId);
      if (courseId) {
        const freshLessons = await LessonService.getLessonsByCourse(courseId);
        setLessons(freshLessons);
      } else {
        setLessons((prev) => [...prev, duplicated]);
      }
      addToast('success', 'Lesson');
    } catch (err: any) {
      console.error('Error duplicating lesson:', err);
      addToast('error', 'Lesson.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, sectionId?: string | null) => {
    if (!window.confirm('Delete')) return;

    try {
      await LessonService.deleteLesson(lessonId, sectionId || undefined);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      addToast('success', 'Delete');
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      addToast('error', 'Delete.');
    }
  };

  const handleMoveLessonOrder = async (sectionId: string, lessonId: string, direction: 'up' | 'down') => {
    const sectionLessons = lessons
      .filter((l) => l.section_id === sectionId)
      .sort((a, b) => a.order_index - b.order_index);

    const index = sectionLessons.findIndex((l) => l.id === lessonId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionLessons.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sectionLessons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((l) => l.id);

    // Optimistic UI update
    setLessons((prev) => {
      const otherLessons = prev.filter((l) => l.section_id !== sectionId);
      const updatedSectionLessons = reordered.map((l, idx) => ({ ...l, order_index: idx }));
      return [...otherLessons, ...updatedSectionLessons];
    });

    try {
      await LessonService.reorderLessons(sectionId, orderedIds);
      addToast('success', 'Update');
    } catch (err: any) {
      console.error('Error reordering lessons:', err);
      addToast('error', 'Lesson.');
      // Refresh from server
      if (courseId) {
        const fresh = await LessonService.getLessonsByCourse(courseId);
        setLessons(fresh);
      }
    }
  };

  // Quick Status Toggle
  const handleTogglePublish = async () => {
    if (!course) return;
    const newStatus: 'published' | 'draft' | 'archived' = course.status === 'published' ? 'draft' : 'published';

    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'published') {
        if (!course.published_at) {
          updates.published_at = new Date().toISOString();
        }
        if (course.visibility === 'private') {
          addToast('info', 'This course is private and will not appear in the public catalog.');
        }
      }

      if ((course.status as string) === 'archived') {
        updates.archived_at = null;
      }

      const { error } = await supabase.from('courses').update(updates).eq('id', course.id);
      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, ...updates } : null));
      addToast('success', newStatus === 'published' ? 'Course!' : 'Course');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      addToast('error', 'Publish.');
    }
  };

  // Save SEO / Pricing Settings
  const handleSaveTabSettings = async (tabName: 'seo' | 'pricing') => {
    if (!courseId) return;

    try {
      setIsSaving(true);
      let updates: Partial<Course> = { updated_at: new Date().toISOString() };

      if (tabName === 'seo') {
        updates = {
          ...updates,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          seo_keywords: seoKeywords.trim() || null,
        };
      } else if (tabName === 'pricing') {
        if (!/^\d+(\.\d{1,2})?$/.test(priceEgp) || !/^\d+(\.\d{1,2})?$/.test(priceUsd) || ((Number(priceEgp) === 0) !== (Number(priceUsd) === 0))) {
          addToast('error', 'Enter both non-negative regional prices; free courses require both prices to be zero.');
          return;
        }
        updates = {
          ...updates,
          price_egp: priceEgp,
          price_usd: priceUsd,
          drip_enabled: dripEnabled,
          sequential_learning: sequentialLearning,
          certificate_enabled: certificateEnabled,
        };
      }

      const { error } = await supabase.from('courses').update(updates).eq('id', courseId);
      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, ...updates } : null));
      addToast('success', 'Settings');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      addToast('error', 'Settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="lg:pr-72 pt-6 pb-24 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Header */}
          <div className="bg-white rounded-2xl border border-primary-200 p-5 md:p-6 shadow-2xs mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Title & Status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/courses')}
                  className="p-2 bg-primary-50 hover:bg-primary-100 rounded-xl border border-primary-200 text-primary-600 transition-colors"
                  title="Courses"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      Course Builder Shell
                    </span>

                    {course && (
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          course.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : course.status === 'archived'
                            ? 'bg-primary-100 text-primary-700 border-primary-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {course.status === 'published' ? 'Published' : course.status === 'archived' ? 'Archived' : 'Draft'}
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-primary-900 leading-tight">
                    {course?.title || 'Course...'}
                  </h1>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                {course && (
                  <Link
                    to={`/course/${course.id}`}
                    target="_blank"
                    className="bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-primary-600" />
                    <span>Course</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
                  className="bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-primary-600" />
                  <span>Course</span>
                </button>

                <Button
                  type="button"
                  onClick={handleTogglePublish}
                  className={`font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                    course?.status === 'published'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{course?.status === 'published' ? 'Draft' : 'Course'}</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-primary-100 overflow-x-auto no-scrollbar text-sm font-bold">
              {[
                { id: 'curriculum', label: 'Curriculum (Curriculum)', icon: BookOpen },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'pricing', label: 'Pricing', icon: DollarSign },
                { id: 'seo', label: 'Search (SEO)', icon: Globe },
                { id: 'publish', label: 'Publish (Publish)', icon: CheckCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
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
              <p className="text-primary-700 font-bold text-sm">Processing... Course Builder...</p>
            </div>
          ) : errorMessage ? (
            <div className="bg-white border border-danger-200 rounded-2xl p-6 text-left shadow-xs">
              <div className="flex items-center gap-3 text-danger-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Error</h3>
              </div>
              <p className="text-primary-700 text-sm mb-4">{errorMessage}</p>
              <button
                onClick={fetchCourseDetails}
                className="bg-primary-900 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-primary-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: CURRICULUM */}
              {activeTab === 'curriculum' && (
                <CurriculumBuilder courseId={courseId!} />
              )}
              {false && (
                <div className="space-y-6">
                  {/* Header Bar */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-primary-900">Curriculum</h2>
                      <p className="text-primary-600 text-xs mt-0.5">
                        Add.
                      </p>
                    </div>

                    <Button
                      onClick={() => setIsAddSectionOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </Button>
                  </div>

                  {/* Add Section Inline Modal */}
                  {isAddSectionOpen && (
                    <form
                      onSubmit={handleAddSection}
                      className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-2xs space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-amber-900 text-base flex items-center gap-2">
                          <Layers className="w-5 h-5 text-amber-600" />
                          <span>Add</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddSectionOpen(false)}
                          className="text-primary-400 hover:text-primary-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-primary-900 mb-1.5">Section</label>
                        <input
                          type="text"
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          placeholder="Example: Section 1 - Skin Care Foundations"
                          className="w-full px-4 py-2.5 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddSectionOpen(false)}
                          className="px-4 py-2 bg-white text-primary-700 border border-primary-200 rounded-xl text-xs font-bold hover:bg-primary-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5"
                        >
                          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Save</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Sections & Lessons List */}
                  {sections.length === 0 ? (
                    <div className="bg-white border border-dashed border-primary-300 rounded-2xl p-12 text-center">
                      <Layers className="w-12 h-12 text-primary-300 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-primary-900 mb-1">No items are available yet.</h3>
                      <p className="text-primary-500 text-xs mb-4">
                        Add.
                      </p>
                      <Button
                        onClick={() => setIsAddSectionOpen(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-xl text-xs"
                      >
                        <Plus className="w-4 h-4 ml-1 inline" />
                        <span>Add</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sections.map((section, sIndex) => {
                        const sectionLessons = lessons.filter((l) => l.section_id === section.id);

                        return (
                          <div
                            key={section.id}
                            className="bg-white rounded-2xl border border-primary-200 overflow-hidden shadow-2xs"
                          >
                            {/* Section Header */}
                            <div className="bg-primary-50/70 p-4 sm:p-5 border-b border-primary-200 flex items-center justify-between gap-3">
                              {editingSectionId === section.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editingSectionTitle}
                                    onChange={(e) => setEditingSectionTitle(e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-primary-300 rounded-lg text-sm font-bold flex-1"
                                  />
                                  <button
                                    onClick={() => handleUpdateSectionTitle(section.id)}
                                    className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSectionId(null)}
                                    className="p-1.5 bg-primary-200 text-primary-800 rounded-lg text-xs font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                                    {sIndex + 1}
                                  </span>
                                  <h3 className="font-bold text-primary-900 text-base">
                                    {section.title}
                                  </h3>
                                  <span className="text-xs text-primary-500 font-medium bg-primary-100 px-2 py-0.5 rounded-md">
                                    {sectionLessons.length} Lessons
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingSectionId(section.id);
                                    setEditingSectionTitle(section.title);
                                  }}
                                  className="p-1.5 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(section.id)}
                                  className="p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Section Lessons */}
                            <div className="p-4 sm:p-5 space-y-3">
                              {sectionLessons.length === 0 ? (
                                <p className="text-center py-6 text-xs text-primary-400 font-medium">
                                  No items are available yet..
                                </p>
                              ) : (
                                sectionLessons.map((lesson, lIndex) => (
                                  <div
                                    key={lesson.id}
                                    className="p-3.5 bg-white hover:bg-primary-50/80 rounded-xl border border-primary-200/80 flex items-center justify-between gap-3 transition-colors shadow-2xs"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="text-primary-300 hover:text-primary-600 cursor-grab flex-shrink-0">
                                        <GripVertical className="w-4 h-4" />
                                      </div>

                                      {getLessonTypeIcon(lesson.lesson_type || lesson.type)}

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h5 className="font-bold text-primary-900 text-sm truncate">
                                            {lIndex + 1}. {lesson.title}
                                          </h5>
                                        </div>

                                        <div className="flex items-center gap-2.5 text-[11px] text-primary-500 mt-0.5 flex-wrap">
                                          <span className="font-medium bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded">
                                            {lesson.lesson_type || lesson.type || 'Lesson'}
                                          </span>

                                          {(lesson.duration || lesson.estimated_minutes) && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-primary-400" />
                                              {lesson.duration || `${lesson.estimated_minutes} Minute`}
                                            </span>
                                          )}

                                          {lesson.is_preview && (
                                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold text-[10px]">
                                              Free
                                            </span>
                                          )}

                                          <span
                                            className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                              lesson.is_published
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {lesson.is_published ? 'Published' : 'Draft'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveLessonOrder(section.id, lesson.id, 'up')}
                                        disabled={lIndex === 0}
                                        className="p-1.5 text-primary-400 hover:text-primary-800 disabled:opacity-30 rounded-lg transition-colors"
                                        title="Move lesson up"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleMoveLessonOrder(section.id, lesson.id, 'down')}
                                        disabled={lIndex === sectionLessons.length - 1}
                                        className="p-1.5 text-primary-400 hover:text-primary-800 disabled:opacity-30 rounded-lg transition-colors"
                                        title="Move lesson down"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>

                                      <Link
                                        to={`/admin/courses/${courseId}/lessons/${lesson.id}/edit`}
                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateLesson(lesson.id)}
                                        className="p-1.5 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
                                        title="Lesson"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLesson(lesson.id, section.id)}
                                        className="p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}

                              {/* Add Lesson Controls */}
                              {isAddLessonOpen === section.id ? (
                                <form
                                  onSubmit={(e) => handleAddLesson(e, section.id)}
                                  className="mt-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-xs text-amber-900">Add</h5>
                                    <button
                                      type="button"
                                      onClick={() => setIsAddLessonOpen(null)}
                                      className="text-primary-400 hover:text-primary-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-primary-800 mb-1">
                                        Lesson *
                                      </label>
                                      <input
                                        type="text"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                        placeholder="Lesson"
                                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-xs font-medium"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-primary-800 mb-1">
                                        Content
                                      </label>
                                      <select
                                        value={newLessonType}
                                        onChange={(e) => setNewLessonType(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-xs font-bold"
                                      >
                                        <option value="video">Video Lesson</option>
                                        <option value="article">Article</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="audio">Audio Lesson</option>
                                        <option value="quiz">Quiz (Quiz)</option>
                                      </select>
                                    </div>

                                    {newLessonType === 'video' && (
                                      <div>
                                        <label className="block text-[11px] font-bold text-primary-800 mb-1">
                                          Link (Video URL)
                                        </label>
                                        <input
                                          type="text"
                                          value={newLessonUrl}
                                          onChange={(e) => setNewLessonUrl(e.target.value)}
                                          placeholder="https://..."
                                          dir="ltr"
                                          className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-xs"
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <label className="block text-[11px] font-bold text-primary-800 mb-1">
                                        Duration (Example: 12 minutes)
                                      </label>
                                      <input
                                        type="text"
                                        value={newLessonDuration}
                                        onChange={(e) => setNewLessonDuration(e.target.value)}
                                        placeholder="12 Minute"
                                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1">
                                    <input
                                      type="checkbox"
                                      id={`preview-${section.id}`}
                                      checked={newLessonPreview}
                                      onChange={(e) => setNewLessonPreview(e.target.checked)}
                                      className="rounded border-primary-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <label htmlFor={`preview-${section.id}`} className="text-xs font-bold text-primary-800">
                                      Lesson
                                    </label>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                                    <Link
                                      to={`/admin/courses/${courseId}/lessons/new?sectionId=${section.id}`}
                                      className="text-xs text-amber-800 font-bold hover:underline"
                                    >
                                      Lessons ←
                                    </Link>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setIsAddLessonOpen(null)}
                                        className="px-3 py-1.5 bg-white text-primary-700 border border-primary-200 rounded-lg text-xs font-bold"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 flex items-center gap-1"
                                      >
                                        {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                        <span>Save</span>
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddLessonOpen(section.id);
                                      setNewLessonTitle('');
                                      setNewLessonUrl('');
                                      setNewLessonDuration('');
                                      setNewLessonPreview(false);
                                    }}
                                    className="flex-1 py-2.5 border border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 text-primary-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-4 h-4 text-primary-600" />
                                    <span>Add</span>
                                  </button>

                                  <Link
                                    to={`/admin/courses/${courseId}/lessons/new?sectionId=${section.id}`}
                                    className="py-2.5 px-4 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Advanced</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs space-y-6">
                  <h2 className="text-xl font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-600" />
                    <span>Course</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                      <span className="text-xs text-primary-500 font-bold block mb-1">Course</span>
                      <span className="font-bold text-primary-900">{course?.title}</span>
                    </div>

                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                      <span className="text-xs text-primary-500 font-bold block mb-1">Level</span>
                      <span className="font-bold text-primary-900">
                        {course?.category || 'Uncategorized'} | {course?.level || 'All Levels'}
                      </span>
                    </div>

                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                      <span className="text-xs text-primary-500 font-bold block mb-1">Publish</span>
                      <span className="font-bold text-primary-900">
                        {course?.status} - {course?.visibility}
                      </span>
                    </div>

                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                      <span className="text-xs text-primary-500 font-bold block mb-1">Lessons</span>
                      <span className="font-bold text-primary-900">
                        {sections.length} Sections | {lessons.length} Lessons
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary-100 flex items-center justify-between">
                    <p className="text-xs text-primary-500">
                      Edit.
                    </p>
                    <button
                      onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING */}
              {activeTab === 'pricing' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs space-y-6">
                  <h2 className="text-xl font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <span>Pricing</span>
                  </h2>

                  <div className="space-y-6 max-w-xl">
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">Egypt Price (EGP) *</label>
                      <input type="number" min="0" step="0.01" required value={priceEgp} onChange={(e) => setPriceEgp(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">International Price (USD) *</label>
                      <input type="number" min="0" step="0.01" required value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl font-bold text-sm" />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-xl border border-primary-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={certificateEnabled}
                          onChange={(e) => setCertificateEnabled(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-bold text-primary-900">
                          Your verified certificate is ready.
                        </span>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-xl border border-primary-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sequentialLearning}
                          onChange={(e) => setSequentialLearning(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-bold text-primary-900">
                          Sort (Lesson)
                        </span>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-xl border border-primary-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dripEnabled}
                          onChange={(e) => setDripEnabled(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-primary-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-bold text-primary-900">
                          Lessons (Drip Content)
                        </span>
                      </label>
                    </div>

                    <Button
                      onClick={() => handleSaveTabSettings('pricing')}
                      disabled={isSaving}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO */}
              {activeTab === 'seo' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs space-y-6">
                  <h2 className="text-xl font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-600" />
                    <span>Search (SEO)</span>
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={course?.title || 'Course'}
                        className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">Meta Description</label>
                      <textarea
                        rows={3}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">SEO Keywords</label>
                      <input
                        type="text"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="Enter keywords separated by commas..."
                        className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm font-medium"
                      />
                    </div>

                    <Button
                      onClick={() => handleSaveTabSettings('seo')}
                      disabled={isSaving}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save SEO</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 5: PUBLISH */}
              {activeTab === 'publish' && (
                <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-2xs space-y-6">
                  <h2 className="text-xl font-bold text-primary-900 border-b border-primary-100 pb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600" />
                    <span>Publish</span>
                  </h2>

                  {/* Checklist */}
                  <div className="space-y-3">
                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
                      <span className="font-bold text-sm text-primary-900">Course</span>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
                      <span className="font-bold text-sm text-primary-900">
                        Publish ({sections.length} Sections)
                      </span>
                      {sections.length > 0 ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>

                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
                      <span className="font-bold text-sm text-primary-900">
                        Lessons ({lessons.length} Lessons)
                      </span>
                      {lessons.length > 0 ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <Button
                      onClick={handleTogglePublish}
                      className={`font-bold py-3.5 px-8 rounded-xl text-base flex items-center gap-2 ${
                        course?.status === 'published'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>{course?.status === 'published' ? 'Course' : 'Course'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

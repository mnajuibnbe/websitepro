import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isValidUUID } from '../lib/uuid';
import { Loader2, Lock, ShieldAlert, BookOpen, Clock, AlertTriangle, X } from 'lucide-react';

import { Course, CourseSection, Lesson, LessonProgress } from '../types/database.types';
import { CourseLearningHeader } from '../components/player/CourseLearningHeader';
import { CourseSidebar } from '../components/player/CourseSidebar';
import { VideoLessonRenderer } from '../components/player/VideoLessonRenderer';
import { TextLessonRenderer } from '../components/player/TextLessonRenderer';
import { QuizLessonRenderer } from '../components/player/QuizLessonRenderer';
import { AssignmentLessonRenderer } from '../components/player/AssignmentLessonRenderer';
import { PdfLessonRenderer } from '../components/player/PdfLessonRenderer';
import { LessonNavigation } from '../components/player/LessonNavigation';
import { PageContainer } from '../components/layout/PageContainer';
import { LessonDetails } from '../components/player/LessonDetails';
import { prefetchSecureStream } from '../components/video/SecureStreamProvider';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { Button } from '../components/ui/Button';

type AccessState =
  | 'verifying'
  | 'invalid_params'
  | 'not_enrolled'
  | 'pending_enrollment'
  | 'course_not_found'
  | 'lesson_not_found'
  | 'no_lessons'
  | 'allowed'
  | 'error';

export function LessonPlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, token, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progressRows, setProgressRows] = useState<LessonProgress[]>([]);

  const [accessState, setAccessState] = useState<AccessState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsMobileSidebarOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    async function verifyAndLoadLessonData() {
      // 1. Validate route params
      if (!courseId || !lessonId || !isValidUUID(courseId) || !isValidUUID(lessonId)) {
        setAccessState('invalid_params');
        return;
      }

      const cleanCourseId = courseId.trim();
      const cleanLessonId = lessonId.trim();

      if (authLoading) return;
      if (!userId) {
        setAccessState('not_enrolled');
        return;
      }

      // Lesson-to-lesson navigation within an already authorized course should
      // not tear down the entire workspace and repeat every course query.
      if (course?.id === cleanCourseId && lessons.length > 0) {
        const target = lessons.find((lesson) => lesson.id === cleanLessonId);
        if (!target) {
          setAccessState('lesson_not_found');
          return;
        }

        setCurrentLesson(target);
        setAccessState('allowed');
        setIsMobileSidebarOpen(false);

        const existingProgress = progressRows.find((progress) => progress.lesson_id === target.id);
        const { error: accessError } = await supabase
          .from('lesson_progress')
          .upsert(
            {
              user_id: userId,
              course_id: cleanCourseId,
              lesson_id: target.id,
              is_completed: existingProgress?.is_completed ?? false,
              last_accessed_at: new Date().toISOString(),
              completed_at: existingProgress?.completed_at || null,
            },
            { onConflict: 'user_id,lesson_id' }
          );

        if (accessError) {
          console.error('Error updating lesson access time:', accessError);
        }
        return;
      }

      try {
        setAccessState('verifying');
        setErrorMessage(null);

        // 2. Verify Active Enrollment in Database BEFORE querying lessons content
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, status')
          .eq('user_id', userId)
          .eq('course_id', cleanCourseId)
          .maybeSingle();

        if (enrollmentError) {
          console.error('Error verifying enrollment:', enrollmentError);
          setErrorMessage('The requested information could not be loaded. Please try again.');
          setAccessState('error');
          return;
        }

        if (!enrollment) {
          setAccessState('not_enrolled');
          return;
        }

        if (enrollment.status !== 'active') {
          if (enrollment.status === 'pending') {
            setAccessState('pending_enrollment');
          } else {
            setAccessState('not_enrolled');
          }
          return;
        }

        // 3. Fetch Course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', cleanCourseId)
          .single();

        if (courseError || !courseData) {
          setAccessState('course_not_found');
          return;
        }

        // 4. Fetch Course Sections and Lessons
        const [sectionsRes, lessonsRes, progressRes] = await Promise.all([
          supabase
            .from('course_sections')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('is_published', true)
            .is('deleted_at', null)
            .order('order_index', { ascending: true }),
          supabase
            .from('lessons')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('is_published', true)
            .is('deleted_at', null)
            .order('order_index', { ascending: true }),
          supabase
            .from('lesson_progress')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('user_id', userId),
        ]);

        if (lessonsRes.error) {
          console.error('Error fetching lessons:', lessonsRes.error);
          setErrorMessage('The requested information could not be loaded. Please try again.');
          setAccessState('error');
          return;
        }

        const validSections = ((sectionsRes.data || []) as CourseSection[]).sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id));
        const publishedSectionIds = new Set(validSections.map((s) => s.id));
        const rawLessons = (lessonsRes.data || []) as Lesson[];
        const sectionOrder = new Map(validSections.map((section, index) => [section.id, index]));
        const validLessons = rawLessons
          .filter((lesson) => Boolean(lesson.section_id && publishedSectionIds.has(lesson.section_id)))
          .sort((a, b) => (sectionOrder.get(a.section_id!) ?? Number.MAX_SAFE_INTEGER) - (sectionOrder.get(b.section_id!) ?? Number.MAX_SAFE_INTEGER) || a.order_index - b.order_index || a.id.localeCompare(b.id));
        const validProgress = (progressRes.data || []) as LessonProgress[];

        if (validLessons.length === 0) {
          setAccessState('no_lessons');
          return;
        }

        // Validate target lesson
        const target = validLessons.find((l) => l.id === cleanLessonId);
        if (!target) {
          setAccessState('lesson_not_found');
          return;
        }

        if (target.video_url?.includes('drive.google.com')) {
          prefetchSecureStream(target.id, token);
          const nextVideo = validLessons.slice(validLessons.indexOf(target) + 1).find(lesson => lesson.video_url?.includes('drive.google.com'));
          if (nextVideo) prefetchSecureStream(nextVideo.id, token);
        }

        // Confirm lesson section belongs to course
        if (target.section_id && validSections.length > 0) {
          const sectionExists = validSections.some((s) => s.id === target.section_id);
          if (!sectionExists) {
            console.warn('Lesson section does not belong to published sections of course');
          }
        }

        setCourse(courseData as Course);
        setSections(validSections);
        setLessons(validLessons);
        setCurrentLesson(target);
        setProgressRows(validProgress);
        setAccessState('allowed');

        // 5. Track Lesson Access (Upsert last_accessed_at)
        const existingProgress = validProgress.find((p) => p.lesson_id === target.id);
        const { error: accessError } = await supabase
          .from('lesson_progress')
          .upsert(
            {
              user_id: userId,
              course_id: cleanCourseId,
              lesson_id: target.id,
              is_completed: existingProgress ? existingProgress.is_completed : false,
              last_accessed_at: new Date().toISOString(),
              completed_at: existingProgress?.completed_at || null,
            },
            { onConflict: 'user_id,lesson_id' }
          );

        if (accessError) {
          console.error('Error updating lesson access time:', accessError);
        }
      } catch (err: any) {
        console.error('Unexpected error in LessonPlayer:', err);
        setErrorMessage(err.message || 'Error.');
        setAccessState('error');
      }
    }

    verifyAndLoadLessonData();
  }, [courseId, lessonId, userId, authLoading, token]);

  // Order lessons canonically (Section order ASC -> Lesson order ASC)
  const orderedLessons = useMemo(() => {
    const sectionOrderMap = new Map<string, number>(sections.map((s) => [s.id, s.order_index]));
    return [...lessons].sort((a, b) => {
      const secOrderA: number = a.section_id ? (sectionOrderMap.get(a.section_id) ?? 0) : 0;
      const secOrderB: number = b.section_id ? (sectionOrderMap.get(b.section_id) ?? 0) : 0;
      if (secOrderA !== secOrderB) return secOrderA - secOrderB;
      return a.order_index - b.order_index;
    });
  }, [sections, lessons]);

  // Derive Previous and Next lessons
  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return orderedLessons.findIndex((l) => l.id === currentLesson.id);
  }, [currentLesson, orderedLessons]);

  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  // Derive completed lesson IDs
  const completedLessonIds = useMemo(() => {
    return progressRows.filter((p) => p.is_completed).map((p) => p.lesson_id);
  }, [progressRows]);

  const isCurrentCompleted = currentLesson ? completedLessonIds.includes(currentLesson.id) : false;

  // Calculate Course Progress Percentage
  const totalLessonsCount = lessons.length;
  const completedLessonsCount = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercentage = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  // Map lesson section
  const currentSection = useMemo(() => {
    if (!currentLesson || !currentLesson.section_id) return null;
    return sections.find((s) => s.id === currentLesson.section_id) || null;
  }, [currentLesson, sections]);

  // Navigation handler
  const handleNavigateLesson = (target: Lesson) => {
    setIsMobileSidebarOpen(false);
    navigate(`/learn/${courseId}/lesson/${target.id}`);
  };

  // Mark Complete & Continue handler
  const handleCompleteAndContinue = async () => {
    if (!currentLesson || !courseId || !user || isCompleting) return;

    // Backend-facing handler guard: quiz lessons cannot be completed manually
    if (currentLesson.type === 'quiz') {
      console.warn('Quiz lessons cannot be completed manually via handleCompleteAndContinue');
      return;
    }

    try {
      setIsCompleting(true);
      const now = new Date().toISOString();

      const existing = progressRows.find((p) => p.lesson_id === currentLesson.id);

      const { data: updatedRow, error: saveError } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            lesson_id: currentLesson.id,
            is_completed: true,
            completed_at: existing?.completed_at || now,
            last_accessed_at: now,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (saveError) {
        console.error('Error saving lesson completion:', saveError);
      } else if (updatedRow) {
        setProgressRows((prev) => {
          const filtered = prev.filter((p) => p.lesson_id !== currentLesson.id);
          return [...filtered, updatedRow as LessonProgress];
        });
      }

      // Automatically advance to Next Lesson if one exists
      if (nextLesson) {
        navigate(`/learn/${courseId}/lesson/${nextLesson.id}`);
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Access State Error / Status Views
  if (accessState === 'verifying' || authLoading) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-700 font-bold text-lg">Loading...</p>
      </div>
    );
  }

  if (accessState === 'invalid_params') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-warning-50 text-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Invalid lesson link</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            This lesson address is incomplete or invalid. Return to your courses and choose a lesson again.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/my-courses')}>
            My Courses
          </Button>
        </div>
      </div>
    );
  }

  if (accessState === 'not_enrolled') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-warning-50 text-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Enrollment required</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            You need an active enrollment to access this course.
          </p>
          <div className="flex flex-col gap-3">
            {courseId && (
              <Button variant="primary" className="w-full" onClick={() => navigate(`/course/${courseId}`)}>
                View course details
              </Button>
            )}
            <Button variant="secondary" className="w-full" onClick={() => navigate('/my-courses')}>
              My Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (accessState === 'pending_enrollment') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Pending Approval</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            Your enrollment is awaiting confirmation. You can check its status from My Courses.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/my-courses')}>
            My Courses
          </Button>
        </div>
      </div>
    );
  }

  if (accessState === 'course_not_found' || accessState === 'lesson_not_found') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            {accessState === 'course_not_found' ? 'Course not found' : 'Lesson not found'}
          </h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            {accessState === 'course_not_found'
              ? 'This course could not be found or is no longer available.'
              : 'This lesson could not be found or is not published.'}
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate(courseId ? `/learn/${courseId}` : '/my-courses')}>
            Back to course
          </Button>
        </div>
      </div>
    );
  }

  if (accessState === 'no_lessons') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">No lessons available</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            This course does not have any published lessons yet.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/my-courses')}>
            My Courses
          </Button>
        </div>
      </div>
    );
  }

  if (accessState === 'error' || !currentLesson || !course) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-left" dir="ltr">
        <div className="bg-danger-50 text-danger-700 p-8 rounded-2xl border border-danger-200 text-center max-w-md w-full">
          <h2 className="font-bold text-2xl mb-2">Lesson unavailable</h2>
          <p className="mb-6">{errorMessage || 'This lesson could not be loaded. Please try again.'}</p>
          <Button variant="danger" className="w-full" onClick={() => navigate('/my-courses')}>
            My Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col" dir="ltr">
      {/* Learning Header */}
      <CourseLearningHeader
        courseTitle={course.title}
        completedCount={completedLessonsCount}
        totalCount={totalLessonsCount}
        progressPercentage={progressPercentage}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace Layout */}
      <PageContainer className="flex-grow py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main lesson content */}
          <main id="main-content" className="lg:col-span-8 flex flex-col">
            {/* Viewer Component */}
            {currentLesson.content_type === 'assignment' && FEATURE_FLAGS.assignments ? (
              <AssignmentLessonRenderer lessonId={currentLesson.id} />
            ) : currentLesson.content_type === 'pdf' || currentLesson.lesson_type === 'pdf' ? (
              <PdfLessonRenderer lessonId={currentLesson.id} title={currentLesson.title} />
            ) : currentLesson.type === 'video' ? (
              <VideoLessonRenderer
                lessonId={currentLesson.id}
                videoUrl={currentLesson.video_url}
                title={currentLesson.title}
                courseId={course.id}
                initialPositionSeconds={progressRows.find((p) => p.lesson_id === currentLesson.id)?.last_position_seconds ?? null}
              />
            ) : currentLesson.type === 'text' ? (
              <TextLessonRenderer content={currentLesson.content} title={currentLesson.title} />
            ) : currentLesson.type === 'quiz' ? (
              <QuizLessonRenderer
                lessonId={currentLesson.id}
                courseId={course.id}
                quizTitle={currentLesson.title}
                onQuizCompleted={() => {
                  if (!user || !courseId) return;
                  setProgressRows((prev) => {
                    const existing = prev.find((p) => p.lesson_id === currentLesson.id);
                    if (existing?.is_completed) return prev;
                    const now = new Date().toISOString();
                    return [
                      ...prev.filter((p) => p.lesson_id !== currentLesson.id),
                      {
                        id: existing?.id || `temp-${Date.now()}`,
                        user_id: user.id,
                        course_id: courseId,
                        lesson_id: currentLesson.id,
                        is_completed: true,
                        completed_at: now,
                        last_accessed_at: now,
                        last_position_seconds: existing?.last_position_seconds ?? null,
                        created_at: now,
                        updated_at: now,
                      },
                    ];
                  });
                }}
              />
            ) : (
              <div className="bg-white border border-primary-200 rounded-2xl p-8 text-center text-primary-600 shadow-sm" dir="ltr">
                <h3 className="text-xl font-bold text-primary-900 mb-2">Content unavailable</h3>
                <p className="text-primary-500 text-sm">This lesson type is not supported yet.</p>
              </div>
            )}

            {/* Lesson Details */}
            <LessonDetails lesson={currentLesson} section={currentSection} />

            {/* Lesson Navigation Controls */}
            <LessonNavigation
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              currentLessonType={currentLesson.type}
              isCurrentCompleted={isCurrentCompleted}
              isCompleting={isCompleting}
              onNavigate={handleNavigateLesson}
              onCompleteAndContinue={handleCompleteAndContinue}
            />
          </main>

          {/* Desktop curriculum sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20">
            <CourseSidebar
              sections={sections}
              lessons={lessons}
              completedLessonIds={completedLessonIds}
              currentLessonId={currentLesson.id}
              courseId={course.id}
              progressPercentage={progressPercentage}
              onLessonSelect={handleNavigateLesson}
            />
          </aside>
        </div>
      </PageContainer>

      {/* Mobile Curriculum Slide-over Drawer */}
      {isMobileSidebarOpen && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMobileSidebarOpen(false); }} className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
          <div role="dialog" aria-modal="true" aria-labelledby="course-curriculum-title" className="w-full max-w-sm bg-white h-[100dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-primary-200 flex items-center justify-between bg-primary-50">
              <h2 id="course-curriculum-title" className="font-bold text-primary-900 text-base">Course curriculum</h2>
              <button
                type="button"
                aria-label="Close course curriculum"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 text-primary-500 hover:text-primary-900 rounded-xl transition-colors min-w-11 min-h-11 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              <CourseSidebar
                sections={sections}
                lessons={lessons}
                completedLessonIds={completedLessonIds}
                currentLessonId={currentLesson.id}
                courseId={course.id}
                progressPercentage={progressPercentage}
                onLessonSelect={handleNavigateLesson}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

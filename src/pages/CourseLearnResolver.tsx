import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isValidUUID } from '../lib/uuid';
import { Loader2, Lock, ShieldAlert, BookOpen, Clock } from 'lucide-react';
import { CourseSection, Lesson, LessonProgress } from '../types/database.types';

type ResolverState =
  | 'verifying'
  | 'invalid_course_id'
  | 'not_enrolled'
  | 'pending_enrollment'
  | 'course_not_found'
  | 'no_lessons'
  | 'error';

export function CourseLearnResolver() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<ResolverState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function resolveContinueLearning() {
      // 1. Validate courseId param
      if (!courseId || !isValidUUID(courseId)) {
        setState('invalid_course_id');
        return;
      }

      const cleanCourseId = courseId.trim();

      if (authLoading) return;
      if (!user) {
        setState('not_enrolled');
        return;
      }

      try {
        setState('verifying');
        setErrorMessage(null);

        // 2. Verify Active Enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', cleanCourseId)
          .maybeSingle();

        if (enrollmentError) {
          console.error('Error verifying enrollment:', enrollmentError);
          setErrorMessage('حدث خطأ أثناء التحقق من اشتراكك في الكورس.');
          setState('error');
          return;
        }

        if (!enrollment) {
          setState('not_enrolled');
          return;
        }

        if (enrollment.status !== 'active') {
          if (enrollment.status === 'pending') {
            setState('pending_enrollment');
          } else {
            setState('not_enrolled');
          }
          return;
        }

        // 3. Check Course existence
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', cleanCourseId)
          .single();

        if (courseError || !courseData) {
          setState('course_not_found');
          return;
        }

        // 4. Fetch sections & lessons
        const [sectionsRes, lessonsRes, progressRes] = await Promise.all([
          supabase
            .from('course_sections')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('is_published', true)
            .order('order_index', { ascending: true }),
          supabase
            .from('lessons')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('is_published', true)
            .order('order_index', { ascending: true }),
          supabase
            .from('lesson_progress')
            .select('*')
            .eq('course_id', cleanCourseId)
            .eq('user_id', user.id),
        ]);

        if (lessonsRes.error) {
          console.error('Error fetching lessons:', lessonsRes.error);
          setErrorMessage('حدث خطأ أثناء جلب دروس الكورس.');
          setState('error');
          return;
        }

        const sections = (sectionsRes.data || []) as CourseSection[];
        const lessons = (lessonsRes.data || []) as Lesson[];
        const progress = (progressRes.data || []) as LessonProgress[];

        if (lessons.length === 0) {
          setState('no_lessons');
          return;
        }

        // Sort lessons in canonical section + lesson order
        const sectionOrderMap = new Map<string, number>(sections.map((s) => [s.id, s.order_index]));
        const sortedLessons = [...lessons].sort((a, b) => {
          const secOrderA: number = a.section_id ? (sectionOrderMap.get(a.section_id) ?? 0) : 0;
          const secOrderB: number = b.section_id ? (sectionOrderMap.get(b.section_id) ?? 0) : 0;
          if (secOrderA !== secOrderB) return secOrderA - secOrderB;
          return a.order_index - b.order_index;
        });

        // 5. Apply Continue Learning Rules:
        // Rule 1: Most recently accessed incomplete lesson
        const incompleteProgress = progress.filter((p) => !p.is_completed);
        incompleteProgress.sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime());

        let targetLesson: Lesson | undefined;

        if (incompleteProgress.length > 0) {
          targetLesson = sortedLessons.find((l) => l.id === incompleteProgress[0].lesson_id);
        }

        // Rule 2: First incomplete published lesson
        if (!targetLesson) {
          const completedLessonIds = new Set(progress.filter((p) => p.is_completed).map((p) => p.lesson_id));
          targetLesson = sortedLessons.find((l) => !completedLessonIds.has(l.id));
        }

        // Rule 3: Last published lesson if course is 100% complete
        if (!targetLesson) {
          targetLesson = sortedLessons[sortedLessons.length - 1];
        }

        // Rule 4: Fallback to first published lesson
        if (!targetLesson) {
          targetLesson = sortedLessons[0];
        }

        // Redirect to lesson route
        navigate(`/learn/${cleanCourseId}/lesson/${targetLesson.id}`, { replace: true });
      } catch (err: any) {
        console.error('Unexpected error in CourseLearnResolver:', err);
        setErrorMessage(err.message || 'حدث خطأ غير متوقع.');
        setState('error');
      }
    }

    resolveContinueLearning();
  }, [courseId, user, authLoading, navigate]);

  if (state === 'verifying' || authLoading) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-700 font-bold text-lg">جاري تحديد موضع المتابعة...</p>
      </div>
    );
  }

  if (state === 'invalid_course_id') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-warning-50 text-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">معرف كورس غير صحيح</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            الرابط المطلوب لا يحتوي على معرف كورس صحيح.
          </p>
          <button
            onClick={() => navigate('/my-courses')}
            className="w-full bg-primary-900 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            الانتقال إلى كورساتي
          </button>
        </div>
      </div>
    );
  }

  if (state === 'not_enrolled') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-warning-50 text-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">أنت غير مسجل في هذا الكورس</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            يتطلب الوصول لمحتوى هذا الكورس وجود اشتراك نشط.
          </p>
          <div className="flex flex-col gap-3">
            {courseId && (
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="w-full bg-accent-600 hover:bg-accent-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                عرض تفاصيل الكورس للتسجيل
              </button>
            )}
            <button
              onClick={() => navigate('/my-courses')}
              className="w-full bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-6 rounded-xl transition-colors"
            >
              العودة لكورساتي
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'pending_enrollment') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">اشتراكك قيد المراجعة</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            طلب اشتراكك في هذا الكورس قيد المراجعة حالياً وسيتم تفعيل الوصول فور الموافقة.
          </p>
          <button
            onClick={() => navigate('/my-courses')}
            className="w-full bg-primary-900 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            العودة إلى كورساتي
          </button>
        </div>
      </div>
    );
  }

  if (state === 'no_lessons') {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-primary-200 shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">لا توجد دروس حالياً</h2>
          <p className="text-primary-600 mb-6 leading-relaxed">
            لم يتم إضافة دروس منشورة في هذا الكورس بعد.
          </p>
          <button
            onClick={() => navigate('/my-courses')}
            className="w-full bg-primary-900 hover:bg-primary-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            العودة إلى كورساتي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-danger-50 text-danger-700 p-8 rounded-2xl border border-danger-200 text-center max-w-md w-full">
        <h2 className="font-bold text-xl mb-2">حدث خطأ</h2>
        <p className="mb-6">{errorMessage || 'تعذر الوصول لهذا الكورس.'}</p>
        <button
          onClick={() => navigate('/my-courses')}
          className="w-full bg-danger-600 hover:bg-danger-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          العودة لكورساتي
        </button>
      </div>
    </div>
  );
}

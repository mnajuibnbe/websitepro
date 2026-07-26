import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchCoursesProgress } from '../../lib/courseProgress';

export function ContinueLearning() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadLatestCourse() {
      try {
        setIsLoading(true);
        setHasError(false);
        let activeCourseId: string | null = null;

        if (user) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          if (enrollmentError) throw enrollmentError;

          if (enrollmentData?.course_id) {
            activeCourseId = enrollmentData.course_id;
          }
        }

        let courseData = null;
        if (activeCourseId) {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', activeCourseId)
            .maybeSingle();
          if (error) throw error;
          courseData = data;
        }

        if (courseData) {
          setCourse(courseData);
          if (user) {
            const progressMap = await fetchCoursesProgress(user.id, [courseData.id]);
            const courseProg = progressMap[courseData.id];
            if (courseProg) {
              setProgress(courseProg.percentage);
            }
          }
        }
      } catch (e) {
        console.error(e);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.id) {
      loadLatestCourse();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
      </div>
    );
  }

  if (hasError) return <div className="bg-white border border-danger-200 rounded-2xl p-8 text-danger-600 font-bold">تعذر تحميل الكورس الحالي.</div>;

  if (!course) {
    return null; // Or return a placeholder if no courses exist
  }

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent-50 rounded-br-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-between">
        
        {/* Content */}
        <div className="flex-grow w-full">
          <div className="flex items-center gap-2 text-sm font-bold text-accent-600 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
            قيد الدراسة
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">
            {course.title}
          </h2>
          <p className="text-primary-600 font-medium mb-6">
            الدرس الحالي: <strong className="text-primary-800">مقدمة الكورس</strong>
          </p>
          
          {/* Progress */}
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-primary-900">التقدم الإجمالي</span>
              <span className="text-accent-600">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-primary-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 rounded-full relative transition-all duration-1000" style={{ width: `${progress}%` }}>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full md:w-auto flex-shrink-0">
          <button 
            onClick={() => navigate(`/learn/${course.id}`)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md shadow-accent-600/20 hover:bg-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <PlayCircle className="w-6 h-6" />
            <span>متابعة التعلم</span>
          </button>
        </div>

      </div>
    </div>
  );
}

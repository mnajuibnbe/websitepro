import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchCoursesProgress } from '../../lib/courseProgress';

export function MyCoursesList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        setIsLoading(true);
        if (user) {
          const { data: enrollmentsData } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .eq('status', 'active');

          let courseIds: string[] = [];
          if (enrollmentsData && enrollmentsData.length > 0) {
            courseIds = enrollmentsData.map(e => String(e.course_id)).filter(Boolean);
          }

          if (courseIds.length > 0) {
            const [{ data: coursesData }, progressMap] = await Promise.all([
              supabase.from('courses').select('*').in('id', courseIds).limit(4),
              fetchCoursesProgress(user.id, courseIds)
            ]);

            if (coursesData) {
              const coursesWithProgress = coursesData.map((course) => {
                const prog = progressMap[course.id] || { percentage: 0 };
                return { ...course, progress: prog.percentage };
              });
              setCourses(coursesWithProgress);
            }
          } else {
            const { data } = await supabase.from('courses').select('*').limit(4);
            if (data) {
              const progressMap = await fetchCoursesProgress(user.id, data.map(c => c.id));
              setCourses(data.map(c => ({ ...c, progress: progressMap[c.id]?.percentage || 0 })));
            }
          }
        } else {
          const { data } = await supabase.from('courses').select('*').limit(4);
          if (data) {
            setCourses(data.map(c => ({ ...c, progress: 0 })));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-primary-900">كورساتي الأخرى</h3>
        <Link to="/courses" className="text-lg font-bold text-accent-600 hover:text-accent-700">عرض الكل</Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {courses.map(course => (
          <div 
            key={course.id} 
            className="bg-white border border-primary-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 group cursor-pointer"
            onClick={() => navigate(`/learn/${course.id}`)}
          >
            <div className="flex h-32">
              <div className="w-1/3 relative overflow-hidden">
                <img src={course.thumbnail || 'https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=400&auto=format&fit=crop'} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-primary-900/20 group-hover:bg-primary-900/10 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-accent-600 opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 shadow-lg">
                    <Play className="w-4 h-4 fill-current ms-0.5" />
                  </div>
                </div>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-center">
                <h4 className="font-bold text-primary-900 line-clamp-2 mb-3 leading-snug">{course.title}</h4>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-primary-500">التقدم</span>
                    <span className="text-primary-900">{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

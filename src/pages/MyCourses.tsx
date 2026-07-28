import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { PlayCircle, Clock, Award, BookOpen, Loader2, Menu } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { isValidUUID } from '../lib/uuid';
import { useNavigate } from 'react-router-dom';
import { fetchCoursesProgress } from '../lib/courseProgress';

export function MyCourses() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'none' | 'inconsistent' | 'error'>('none');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.id) {
      fetchMyCourses();
    }
  }, [user?.id]);

  async function fetchMyCourses() {
    try {
      setIsLoading(true);
      setErrorState('none');

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        setErrorState('error');
        return;
      }

      if (enrollmentsData && enrollmentsData.length > 0) {
        const dbCourseIds = enrollmentsData.map(e => String(e.course_id)).filter(id => id && isValidUUID(id));

        let dbCourses: any[] = [];
        let progressMap: Record<string, any> = {};

        if (dbCourseIds.length > 0) {
          const [{ data: coursesData, error: coursesError }, fetchedProgressMap] = await Promise.all([
            supabase
              .from('courses')
              .select('*')
              .in('id', dbCourseIds),
            fetchCoursesProgress(user!.id, dbCourseIds)
          ]);

          if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            setErrorState('error');
            return;
          } else if (coursesData) {
            dbCourses = coursesData;
          }
          progressMap = fetchedProgressMap;
        }

        const merged = enrollmentsData.map(enrollment => {
          const courseId = String(enrollment.course_id);
          const course = dbCourses.find(c => String(c.id) === courseId);
          const prog = progressMap[courseId] || { totalLessons: 0, completedLessons: 0, percentage: 0 };
          return {
            ...enrollment,
            courses: course,
            progress: prog.percentage,
            completedLessons: prog.completedLessons,
            totalLessons: prog.totalLessons,
          };
        }).filter(e => e.courses);

        if (merged.length === 0) {
           setErrorState('inconsistent');
        }

        setEnrollments(merged);
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      console.error(e);
      setErrorState('error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex font-sans" dir="ltr">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden h-20 bg-white border-b border-primary-200 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-900">My Courses</h1>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <h1 className="text-3xl font-bold text-primary-900 mb-8 hidden lg:block">My Courses</h1>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
              </div>
            ) : errorState === 'error' ? (
              <div className="bg-white rounded-2xl border border-danger-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-danger-50 rounded-full flex items-center justify-center mb-6">
                  <PlayCircle className="w-12 h-12 text-danger-400" />
                </div>
                <h2 className="text-2xl font-bold text-danger-900 mb-3">Error</h2>
                <p className="text-danger-600 mb-8 max-w-md">
                  Your courses could not be loaded. Please try again.
                </p>
                <Button
                  variant="primary"
                  onClick={() => fetchMyCourses()}
                  className="h-12 px-8 text-lg"
                >
                  Retry
                </Button>
              </div>
            ) : errorState === 'inconsistent' ? (
              <div className="bg-white rounded-2xl border border-warning-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-warning-50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-12 h-12 text-warning-400" />
                </div>
                <h2 className="text-2xl font-bold text-warning-900 mb-3">Course Not Found</h2>
                <p className="text-warning-600 mb-8 max-w-md">
                  We could not find this course in your enrollment history.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/courses')}
                  className="h-12 px-8 text-lg"
                >
                  Courses
                </Button>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-12 h-12 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary-900 mb-3">No items found</h2>
                <p className="text-primary-600 mb-8 max-w-md">
                  No courses match this view.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/courses')}
                  className="h-12 px-8 text-lg"
                >
                  Courses
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = enrollment.courses;
                  if (!course) return null;

                  const progress: number = enrollment.progress || 0;
                  const completedLessons: number = enrollment.completedLessons || 0;
                  const totalLessons: number = enrollment.totalLessons || 0;
                  const thumbnail = course.thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800';

                  return (
                    <div key={enrollment.id} className="bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-48 relative overflow-hidden">
                        <img src={thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        {progress === 100 && (
                          <div className="absolute top-4 left-4 bg-success-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                            <Award className="w-4 h-4" /> Completed
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-primary-900 mb-4">{course.title}</h3>

                        <div className="mb-6 mt-auto">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-primary-700">
                              {totalLessons > 0 ? `${completedLessons} of ${totalLessons} lessons completed` : 'No lessons available'}
                            </span>
                            <span className="font-bold text-accent-600" dir="ltr">{progress}%</span>
                          </div>
                          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-success-500' : 'bg-accent-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2 text-sm text-primary-500">
                            <Clock className="w-4 h-4" />
                            <span>Continue Learning</span>
                          </div>
                          <Button
                            variant={progress === 100 ? 'secondary' : 'primary'}
                            onClick={() => navigate(`/learn/${course.id}`)}
                            className="px-6"
                          >
                            {progress === 100 ? 'Course' : 'Continue Learning'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


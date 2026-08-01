import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { PlayCircle, Award, BookOpen, Loader2, Menu, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { isValidUUID } from '../lib/uuid';
import { useNavigate } from 'react-router-dom';
import { fetchCoursesProgress } from '../lib/courseProgress';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { PageContainer } from '../components/layout/PageContainer';

export function MyCourses() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'none' | 'inconsistent' | 'error'>('none');
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

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
              type="button"
              aria-label="Open student navigation"
              className="p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-900">My Courses</h1>
          </div>
        </header>

        <main id="main-content" className="flex-grow overflow-y-auto py-4 sm:py-8">
          <PageContainer className="space-y-8 pb-12">
            <h1 className="text-3xl font-bold text-primary-900 mb-8 hidden lg:block">My Courses</h1>

            {!isLoading && errorState === 'none' && enrollments.length > 0 && (
              <div className="flex flex-col gap-4 rounded-2xl border border-primary-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter courses by progress">
                  {(['all', 'in-progress', 'completed'] as const).map(value => (
                    <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${filter === value ? 'bg-accent-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}>{value.replace('-', ' ')}</button>
                  ))}
                </div>
                <label className="relative block sm:w-72"><span className="sr-only">Search my courses</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search my courses" className="w-full rounded-lg border border-primary-200 py-2.5 pl-10 pr-3" /></label>
              </div>
            )}

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
                  The requested information could not be loaded. Please try again. Please.
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
                <h2 className="text-2xl font-bold text-warning-900 mb-3">Courses Unavailable</h2>
                <p className="text-warning-600 mb-8 max-w-md">
                  We could not load your course information. Please try again shortly.
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
                  Enroll in a course to begin your learning journey.
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
                {enrollments.filter(enrollment => {
                  const progress = Number(enrollment.progress || 0);
                  const matchesStatus = filter === 'all' || (filter === 'completed' ? progress === 100 : progress < 100);
                  return matchesStatus && String(enrollment.courses?.title || '').toLowerCase().includes(search.trim().toLowerCase());
                }).map((enrollment) => {
                  const course = enrollment.courses;
                  if (!course) return null;

                  const progress: number = enrollment.progress || 0;
                  const completedLessons: number = enrollment.completedLessons || 0;
                  const totalLessons: number = enrollment.totalLessons || 0;
                  const thumbnail = course.thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800';

                  return (
                    <article key={enrollment.id} className="bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-48 relative overflow-hidden">
                        <OptimizedImage src={thumbnail} alt="" displayWidth={800} width="800" height="450" className="w-full h-full object-cover" />
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
                              {totalLessons > 0 ? `${completedLessons} of ${totalLessons} lessons completed` : 'Progress will appear after your first lesson'}
                            </span>
                            <span className="font-bold text-accent-600" dir="ltr">{progress}%</span>
                          </div>
                          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                            <div
                              role="progressbar"
                              aria-label={`${course.title} progress`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={progress}
                              className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-success-500' : 'bg-accent-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          {progress === 100 ? <Button variant="secondary" onClick={() => navigate('/certificate', { state: { courseId: course.id } })}>Certificate</Button> : <span className="text-sm text-primary-500">Ready when you are</span>}
                          <Button
                            variant={progress === 100 ? 'secondary' : 'primary'}
                            onClick={() => navigate(`/learn/${course.id}`)}
                            className="px-6"
                          >
                            {progress === 100 ? 'Review course' : progress > 0 ? 'Continue learning' : 'Start course'}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}

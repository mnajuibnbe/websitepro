import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { PlayCircle, Clock, Award, BookOpen, Loader2, Menu } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function MyCourses() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMyCourses();
  }, []);

  async function fetchMyCourses() {
    try {
      setIsLoading(true);
      
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Step 1: Fetch enrollments without attempting to join 'courses' to avoid PGRST200 if FK is missing
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return;
      }
      
      if (enrollmentsData && enrollmentsData.length > 0) {
        // Step 2: Fetch courses manually
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const courseIds = enrollmentsData.map(e => String(e.course_id)).filter(id => id && uuidRegex.test(id));
        
        if (courseIds.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
            
          if (coursesError) {
            console.error('Error fetching courses:', coursesError);
          }
          
          const merged = enrollmentsData.map(enrollment => ({
            ...enrollment,
            courses: coursesData?.find(c => c.id === enrollment.course_id)
          }));
          
          setEnrollments(merged);
        } else {
          setEnrollments(enrollmentsData);
        }
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex font-sans rtl" dir="rtl">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        {/* Top Header - Mobile Only */}
        <header className="lg:hidden h-20 bg-white border-b border-primary-200 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-900">كورساتي</h1>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <h1 className="text-3xl font-bold text-primary-900 mb-8 hidden lg:block">كورساتي</h1>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-12 h-12 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary-900 mb-3">لا توجد كورسات متاحة حالياً</h2>
                <p className="text-primary-600 mb-8 max-w-md">
                  يبدو أنه لم يتم اعتماد أي كورسات لك حتى الآن، أو أنك لم تقم بالتسجيل في أي كورس بعد.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/courses')}
                  className="h-12 px-8 text-lg"
                >
                  استكشاف الكورسات
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = enrollment.courses;
                  if (!course) return null;
                  
                  // For now, hardcode progress to 0 since we don't track it yet
                  const progress: number = 0;
                  const thumbnail = course.thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800';

                  return (
                    <div key={enrollment.id} className="bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-48 relative overflow-hidden">
                        <img src={thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        {progress === 100 && (
                          <div className="absolute top-4 left-4 bg-success-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                            <Award className="w-4 h-4" /> مكتمل
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-primary-900 mb-4">{course.title}</h3>
                        
                        <div className="mb-6 mt-auto">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-primary-700">نسبة الإنجاز</span>
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
                            <span>متاح الآن</span>
                          </div>
                          <Button 
                            variant={progress === 100 ? 'secondary' : 'primary'} 
                            onClick={() => navigate(`/lesson?courseId=${course.id}`)}
                            className="px-6"
                          >
                            {progress === 100 ? 'مراجعة الكورس' : 'متابعة التعلم'}
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

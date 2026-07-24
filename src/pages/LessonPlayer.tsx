import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Loader2, PlayCircle, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function LessonPlayer({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const courseId = params.get('courseId');
    const lessonId = params.get('lessonId');

    async function loadData() {
      if (!courseId) {
        setError('رقم الكورس مفقود. يرجى العودة للوحة التحكم واختيار كورس.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError || !courseData) throw new Error('لم يتم العثور على الكورس.');

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (lessonsError) throw new Error('حدث خطأ أثناء تحميل الدروس.');

        setCourse(courseData);
        setLessons(lessonsData || []);

        if (lessonsData && lessonsData.length > 0) {
          if (lessonId) {
            const found = lessonsData.find(l => l.id === lessonId);
            setCurrentLesson(found || lessonsData[0]);
          } else {
            setCurrentLesson(lessonsData[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleLessonSelect = (lesson: any) => {
    setCurrentLesson(lesson);
    setIsMobileSidebarOpen(false);
    setIsPlaying(false);
    if (course) {
      window.location.hash = `#/lesson?courseId=${course.id}&lessonId=${lesson.id}`;
    }
  };

  const handleCompleteLesson = () => {
    if (currentLesson && !completedLessons.includes(currentLesson.id)) {
      setCompletedLessons([...completedLessons, currentLesson.id]);
    }
  };

  if (isLoading) {
    return (      
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center">        
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />        
        <p className="text-primary-600 font-medium">جاري تحميل مساحة التعلم...</p>      
      </div>    
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
        <div className="bg-danger-50 text-danger-600 px-6 py-4 rounded-xl border border-danger-200 text-center max-w-md w-full">
          <p className="font-bold mb-2">عذراً</p>
          <p>{error}</p>
          <button 
            onClick={() => onNavigate ? onNavigate('#/dashboard') : (window.location.hash = '#/dashboard')} 
            className="mt-4 inline-block font-bold underline hover:text-danger-800"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons.length / lessons.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col font-sans" dir="rtl">
      <header className="h-16 bg-white border-b border-primary-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate ? onNavigate('#/dashboard') : (window.location.hash = '#/dashboard')}
            className="flex items-center gap-2 text-primary-600 hover:text-accent-600 transition-colors group min-h-[44px]"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:transform-none" />
            <span className="font-bold text-sm hidden sm:block">العودة للوحة التحكم</span>
          </button>
          <div className="w-px h-6 bg-primary-200 hidden sm:block"></div>
          <span className="font-bold text-primary-900 text-sm line-clamp-1">
            {course.title}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden flex items-center justify-center gap-2 text-primary-600 hover:text-primary-900 bg-primary-50 px-4 min-h-[44px] rounded-lg font-medium text-sm"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
            <span>محتوى الكورس</span>
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="relative w-full aspect-video bg-primary-900 rounded-2xl overflow-hidden shadow-lg group flex flex-col">
                {currentLesson?.type === 'video' || !currentLesson?.type ? (
                  <>
                    <img 
                      src={course.thumbnail || "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1200&auto=format&fit=crop"} 
                      alt="Video Thumbnail" 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-60'}`}
                    />
                    {!isPlaying ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-900/40">
                        <button 
                          onClick={() => setIsPlaying(true)}
                          className="w-20 h-20 bg-accent-600/90 text-white rounded-full flex items-center justify-center hover:bg-accent-500 hover:scale-110 transition-all shadow-xl backdrop-blur-sm"
                        >
                          <PlayCircle className="w-10 h-10" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <span className="text-white opacity-50">Video Player Simulation</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-800 text-white">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <span className="text-lg font-medium">هذا الدرس عبارة عن مستند نصي</span>
                  </div>
                )}
              </div>

              {currentLesson && (
                <div className="bg-white p-6 rounded-2xl border border-primary-200 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900 mb-2">{currentLesson.title}</h1>
                    <p className="text-primary-600 leading-relaxed max-w-3xl">
                      {currentLesson.description || 'لا يوجد وصف متاح لهذا الدرس.'}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button 
                      onClick={handleCompleteLesson}
                      disabled={completedLessons.includes(currentLesson.id)}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        completedLessons.includes(currentLesson.id) 
                          ? 'bg-success-50 text-success-600 cursor-not-allowed border border-success-200'
                          : 'bg-accent-600 hover:bg-accent-700 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{completedLessons.includes(currentLesson.id) ? 'تم الإنجاز' : 'إكمال الدرس'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block lg:col-span-4 sticky top-24">
              <SidebarContent 
                course={course} 
                lessons={lessons} 
                currentLesson={currentLesson} 
                onSelect={handleLessonSelect} 
                progressPercentage={progressPercentage}
                completedLessons={completedLessons}
              />
            </div>

          </div>
        </div>
      </main>

      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          <div className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-white rounded-full p-1 shadow-sm border border-primary-100">
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-primary-500 hover:text-primary-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto pt-16 pb-6">
              <SidebarContent 
                course={course} 
                lessons={lessons} 
                currentLesson={currentLesson} 
                onSelect={handleLessonSelect} 
                progressPercentage={progressPercentage}
                completedLessons={completedLessons}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ course, lessons, currentLesson, onSelect, progressPercentage, completedLessons }: any) {
  return (
    <div className="bg-white border border-primary-200 rounded-2xl flex flex-col h-full max-h-[800px] shadow-sm">
      <div className="p-4 md:p-6 border-b border-primary-200">
        <h2 className="font-bold text-primary-900 mb-2">محتوى الكورس</h2>
        <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <p className="text-xs text-primary-500 font-medium">مكتمل {progressPercentage}% ({completedLessons.length} من {lessons.length} درس)</p>
      </div>
      
      <div className="overflow-y-auto flex-grow hide-scrollbar p-2">
        {lessons.length === 0 ? (
          <div className="text-center p-6 text-primary-500 text-sm">
            لا توجد دروس متاحة حالياً
          </div>
        ) : (
          <div className="space-y-1">
            {lessons.map((lesson: any, index: number) => {
              const isCurrent = currentLesson?.id === lesson.id;
              const isCompleted = completedLessons.includes(lesson.id);
              
              return (
                <button 
                  key={lesson.id}
                  onClick={() => onSelect(lesson)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-right ${
                    isCurrent 
                      ? 'bg-accent-50 border border-accent-200' 
                      : 'hover:bg-primary-50 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success-500" />
                    ) : isCurrent ? (
                      <PlayCircle className="w-5 h-5 text-accent-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-primary-300 flex items-center justify-center">
                        <span className="text-[10px] text-primary-400 font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm leading-snug mb-1 ${
                      isCurrent ? 'font-bold text-accent-900' : 'font-medium text-primary-700'
                    }`}>
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-primary-400 font-medium">
                      {lesson.type === 'video' ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      <span>{lesson.duration ? `${lesson.duration} دقيقة` : 'غير محدد'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

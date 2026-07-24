import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { PlayCircle, Clock, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function MyCourses({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const enrolledCourses = [
    {
      id: '1',
      title: 'دبلومة العناية بالبشرة الشاملة',
      progress: 65,
      lastAccessed: 'منذ يومين',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      title: 'أساسيات التركيبات التجميلية',
      progress: 100,
      lastAccessed: 'منذ أسبوع',
      image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-8">كورساتي</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map(course => (
              <div key={course.id} className="bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-48 relative overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  {course.progress === 100 && (
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
                      <span className="font-bold text-accent-600" dir="ltr">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-success-500' : 'bg-accent-500'}`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm text-primary-500">
                      <Clock className="w-4 h-4" />
                      <span>{course.lastAccessed}</span>
                    </div>
                    <Button 
                      variant={course.progress === 100 ? 'secondary' : 'primary'} 
                      onClick={() => onNavigate('#/lesson')}
                      className="px-6"
                    >
                      {course.progress === 100 ? 'مراجعة الكورس' : 'متابعة التعلم'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

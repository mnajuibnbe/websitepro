import React from 'react';
import { Play } from 'lucide-react';

export function MyCoursesList() {
  const courses = [
    {
      id: 1,
      title: 'علم تركيبات منتجات التفتيح',
      progress: 80,
      image: 'https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'أسرار العناية بفروة الرأس',
      progress: 15,
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=400&auto=format&fit=crop'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-primary-900">كورساتي الأخرى</h3>
        <a href="#/courses" className="text-lg font-bold text-accent-600 hover:text-accent-700">عرض الكل</a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {courses.map(course => (
          <div 
            key={course.id} 
            className="bg-white border border-primary-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 group cursor-pointer"
            onClick={() => window.location.hash = '#/lesson'}
          >
            <div className="flex h-32">
              <div className="w-1/3 relative overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                    <div className="h-full bg-accent-500 rounded-full" style={{ width: `${course.progress}%` }}></div>
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

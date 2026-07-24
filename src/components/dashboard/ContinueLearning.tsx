import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';

export function ContinueLearning() {
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
            دبلومة العناية بالبشرة والشعر
          </h2>
          <p className="text-primary-600 font-medium mb-6">
            الدرس الحالي: <strong className="text-primary-800">حاجز البشرة (Skin Barrier)</strong>
          </p>
          
          {/* Progress */}
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-primary-900">التقدم الإجمالي</span>
              <span className="text-accent-600">35%</span>
            </div>
            <div className="w-full h-2.5 bg-primary-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 rounded-full w-[35%] relative">
                <div className="absolute inset-0 bg-white/20 overflow-hidden">
                  <div className="w-full h-full -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-primary-500 font-medium mt-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>متبقي 45 ساعة تقريباً</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full md:w-auto flex-shrink-0">
          <button 
            onClick={() => window.location.hash = '#/lesson'}
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

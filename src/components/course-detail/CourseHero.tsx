import React from 'react';
import { ChevronLeft, Star, PlayCircle, Clock, Award } from 'lucide-react';
import { Button } from '../ui/Button';

export function CourseHero() {
  return (
    <div className="pb-8 border-b border-primary-200 mb-8 lg:mb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <a href="#/" className="hover:text-accent-600 transition-colors">الرئيسية</a>
        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
        <a href="#/courses" className="hover:text-accent-600 transition-colors">الكورسات</a>
        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
        <span className="text-primary-900 font-bold">دبلومة العناية بالبشرة</span>
      </nav>

      {/* Title & Subtitle */}
      <span className="inline-block py-1 px-3 rounded-full bg-accent-100 text-accent-800 text-xs font-bold mb-4 uppercase tracking-wider">
        Diploma
      </span>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-6 leading-snug">
        دبلومة العناية بالبشرة والشعر - الجزء الأول
      </h1>
      <p className="text-lg md:text-xl text-primary-600 mb-8 leading-relaxed max-w-3xl">
        تعلّمي كيف تفهمين المكونات، وتقيمين المنتجات، وتبنين قرارات عملية قائمة على أساس علمي في العناية بالبشرة والشعر.
      </p>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-y-4 gap-x-6 mb-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-warning-500">
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-primary-900">4.9</span>
          <span className="text-primary-500 underline decoration-primary-300">(120 تقييم)</span>
        </div>
        
        <div className="w-1.5 h-1.5 rounded-full bg-primary-300 hidden sm:block"></div>
        
        <div className="flex items-center gap-2 text-primary-700 font-medium">
           <Clock className="w-5 h-5 text-primary-400" />
           <span>80 ساعة تعليمية</span>
        </div>

        <div className="w-1.5 h-1.5 rounded-full bg-primary-300 hidden sm:block"></div>
        
        <div className="flex items-center gap-2 text-primary-700 font-medium">
           <Award className="w-5 h-5 text-primary-400" />
           <span>شهادة معتمدة</span>
        </div>
      </div>

      {/* Trailer Button */}
      <Button variant="secondary" icon={<PlayCircle className="w-5 h-5" />} className="h-12 px-6">
        شاهدي الفيديو التعريفي
      </Button>
    </div>
  );
}

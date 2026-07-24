import React from 'react';
import { ChevronLeft } from 'lucide-react';

export function CoursesHeader() {
  const categories = [
    'الكل',
    'برامج الدبلومة',
    'العناية بالبشرة',
    'العناية بالشعر',
    'كورسات متخصصة',
    'مجانية'
  ];

  return (
    <div className="pt-24 md:pt-32 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8">
        <a href="#/" className="hover:text-accent-600 transition-colors">الرئيسية</a>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-primary-900 font-bold">الكورسات</span>
      </nav>

      {/* Header Content */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4 leading-snug">
        استكشفي برامج Tutiba التعليمية
      </h1>
      <p className="text-lg text-primary-600 max-w-3xl mb-10 leading-relaxed">
        برامج علمية منظمة تساعدك على فهم المكونات، وتحليل المنتجات، وتطوير قرارات عملية في العناية بالبشرة والشعر.
      </p>

      {/* Category Shortcuts */}
      <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-3">
        {categories.map((category, index) => {
          const isActive = category === 'العناية بالبشرة';
          return (
            <button
              key={index}
              aria-pressed={isActive}
              className={`flex-none px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-accent-600 text-white shadow-sm ring-2 ring-accent-600 ring-offset-2' 
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

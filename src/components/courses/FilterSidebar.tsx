import React from 'react';
import { Button } from '../ui/Button';

export function FilterSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-full pl-8 border-l border-primary-200">
      <h2 className="text-xl font-bold text-primary-900 mb-6">الفلاتر</h2>

      {/* Category */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">التصنيف</h3>
        <div className="flex flex-col gap-3">
          {['برامج الدبلومة', 'العناية بالبشرة', 'العناية بالشعر', 'كورسات متخصصة'].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-3 h-3 bg-accent-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">المستوى</h3>
        <div className="flex flex-col gap-3">
          {['مبتدئ', 'متوسط', 'متقدم'].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-3 h-3 bg-accent-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">السعر</h3>
        <div className="flex flex-col gap-3">
          {['الكل', 'مجاني', 'مدفوع'].map((item, index) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded-full group-hover:border-accent-500 transition-colors">
                <input type="radio" name="price" defaultChecked={index === 0} className="peer sr-only" />
                <div className="w-2.5 h-2.5 bg-accent-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">المدة</h3>
        <div className="flex flex-col gap-3">
          {['أقل من 5 ساعات', '5 - 20 ساعة', 'أكثر من 20 ساعة'].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-3 h-3 bg-accent-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="tertiary" className="mt-4 border border-primary-200 hover:bg-primary-50 hover:border-primary-300">
        مسح الفلاتر
      </Button>
    </aside>
  );
}

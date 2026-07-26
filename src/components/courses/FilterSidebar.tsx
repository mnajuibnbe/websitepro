import React from 'react';
import { Button } from '../ui/Button';
import { CourseCatalogFilters, EMPTY_CATALOG_FILTERS } from '../../lib/courseCatalog';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  filters: CourseCatalogFilters;
  onChange: (filters: CourseCatalogFilters) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

const categories = ['برامج الدبلومة', 'العناية بالبشرة', 'العناية بالشعر', 'كورسات متخصصة'];
const levels = [
  { label: 'مبتدئ', value: 'beginner' },
  { label: 'متوسط', value: 'intermediate' },
  { label: 'متقدم', value: 'advanced' },
];
const durations = [
  { label: 'أقل من 5 ساعات', value: 'short' },
  { label: '5 - 20 ساعة', value: 'medium' },
  { label: 'أكثر من 20 ساعة', value: 'long' },
] as const;

export function FilterSidebar({ filters, onChange, mobileOpen, onClose }: FilterSidebarProps) {
  const toggle = (key: 'categories' | 'levels' | 'durations', value: string) => {
    const values = filters[key] as string[];
    onChange({ ...filters, [key]: values.includes(value) ? values.filter(item => item !== value) : [...values, value] });
  };

  return (
    <aside
      id="course-filter-panel"
      className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex flex-col w-full p-5 lg:pt-0 lg:pr-0 lg:pb-0 lg:pl-8 border border-primary-200 lg:border-y-0 lg:border-r-0 lg:border-l rounded-xl lg:rounded-none bg-primary-50/50 lg:bg-transparent`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary-900">الفلاتر</h2>
        <button type="button" onClick={onClose} className="lg:hidden p-2 rounded-lg text-primary-600 hover:bg-primary-100" aria-label="إغلاق الفلاتر">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">التصنيف</h3>
        <div className="flex flex-col gap-3">
          {categories.map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" checked={filters.categories.includes(item)} onChange={() => toggle('categories', item)} className="peer sr-only" />
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
          {levels.map((item) => (
            <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" checked={filters.levels.includes(item.value)} onChange={() => toggle('levels', item.value)} className="peer sr-only" />
                <div className="w-3 h-3 bg-accent-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">السعر</h3>
        <div className="flex flex-col gap-3">
          {[{ label: 'الكل', value: 'all' }, { label: 'مجاني', value: 'free' }, { label: 'مدفوع', value: 'paid' }].map((item) => (
            <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded-full group-hover:border-accent-500 transition-colors">
                <input type="radio" name="price" checked={filters.price === item.value} onChange={() => onChange({ ...filters, price: item.value as CourseCatalogFilters['price'] })} className="peer sr-only" />
                <div className="w-2.5 h-2.5 bg-accent-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-8">
        <h3 className="font-bold text-primary-900 mb-4">المدة</h3>
        <div className="flex flex-col gap-3">
          {durations.map((item) => (
            <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 border border-primary-300 rounded group-hover:border-accent-500 transition-colors">
                <input type="checkbox" checked={filters.durations.includes(item.value)} onChange={() => toggle('durations', item.value)} className="peer sr-only" />
                <div className="w-3 h-3 bg-accent-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-primary-700 font-medium group-hover:text-primary-900 transition-colors">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="tertiary" onClick={() => onChange(EMPTY_CATALOG_FILTERS)} className="mt-4 border border-primary-200 hover:bg-primary-50 hover:border-primary-300">
        مسح الفلاتر
      </Button>
    </aside>
  );
}

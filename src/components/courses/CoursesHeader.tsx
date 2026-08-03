import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CourseCatalogFilters } from '../../lib/courseCatalog';
import type { CourseCategory } from '../../services/courseCategories.service';

interface CoursesHeaderProps {
  filters: CourseCatalogFilters;
  onChange: (filters: CourseCatalogFilters) => void;
  categories: CourseCategory[];
}

export function CoursesHeader({ filters, onChange, categories }: CoursesHeaderProps) {
  const shortcuts = [
    { key: 'all', label: 'All courses', category: null, price: 'all' as const },
    ...categories.map(category => ({ key: category.slug, label: category.name, category: category.name, price: 'all' as const })),
    { key: 'free', label: 'Free', category: null, price: 'free' as const },
  ];

  return (
    <div className="pb-8 pt-24 md:pt-32">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8">
        <Link to="/" className="hover:text-accent-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-primary-900 font-bold">Courses</span>
      </nav>

      {/* Header Content */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4 leading-snug">
        Explore Tutiba Course Catalog
      </h1>
      <p className="max-w-3xl text-lg leading-relaxed text-primary-600">
        Course Catalog.
      </p>

      {/* Category Shortcuts */}
      <div className="-mx-4 mt-14 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:mt-10 md:px-0">
        {shortcuts.map((shortcut) => {
          const isFree = shortcut.key === 'free';
          const isAll = shortcut.key === 'all';
          const isActive = isAll
            ? filters.categories.length === 0 && filters.price === 'all'
            : isFree
              ? filters.price === 'free'
              : filters.price === 'all' && filters.categories.length === 1 && filters.categories[0] === shortcut.category;
          return (
            <button
              key={shortcut.key}
              aria-pressed={isActive}
              onClick={() => onChange({
                ...filters,
                categories: shortcut.category ? [shortcut.category] : [],
                price: isFree ? 'free' : 'all',
              })}
              className={`flex-none px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-accent-600 text-white shadow-sm ring-2 ring-accent-600 ring-offset-2'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
              }`}
            >
              {shortcut.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

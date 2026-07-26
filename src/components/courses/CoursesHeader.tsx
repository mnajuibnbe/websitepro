import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CourseCatalogFilters } from '../../lib/courseCatalog';

interface CoursesHeaderProps {
  filters: CourseCatalogFilters;
  onChange: (filters: CourseCatalogFilters) => void;
}

export function CoursesHeader({ filters, onChange }: CoursesHeaderProps) {
  const categories = [
    'Learn More',
    'Learn More',
    'Learn More',
    'Learn More',
    'Learn More',
    'Free'
  ];

  return (
    <div className="pt-24 md:pt-32 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8">
        <Link to="/" className="hover:text-accent-600 transition-colors">Home</Link>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-primary-900 font-bold">Courses</span>
      </nav>

      {/* Header Content */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4 leading-snug">
        Explore Tutiba Learn More
      </h1>
      <p className="text-lg text-primary-600 max-w-3xl mb-10 leading-relaxed">
        Learn More.
      </p>

      {/* Category Shortcuts */}
      <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-3">
        {categories.map((category, index) => {
          const isFree = category === 'Free';
          const isAll = category === 'Learn More';
          const isActive = isAll
            ? filters.categories.length === 0 && filters.price === 'all'
            : isFree
              ? filters.price === 'free'
              : filters.categories.length === 1 && filters.categories[0] === category;
          return (
            <button
              key={index}
              aria-pressed={isActive}
              onClick={() => onChange({
                ...filters,
                categories: isAll || isFree ? [] : [category],
                price: isFree ? 'free' : 'all',
              })}
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

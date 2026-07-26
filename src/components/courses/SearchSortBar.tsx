import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { CourseCatalogFilters } from '../../lib/courseCatalog';

interface SearchSortBarProps {
  filters: CourseCatalogFilters;
  onChange: (filters: CourseCatalogFilters) => void;
  resultCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export function SearchSortBar({ filters, onChange, resultCount, filtersOpen, onToggleFilters }: SearchSortBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-primary-200 mb-8">

      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-primary-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Course..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full h-12 pr-12 pl-4 bg-white border border-primary-300 rounded-lg text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 shadow-sm"
        />
      </div>

      {/* Results Count & Sort */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between w-full md:w-auto gap-4 md:gap-6">
        <span className="text-primary-600 font-medium whitespace-nowrap w-full sm:w-auto">
          <strong className="text-primary-900 text-lg mx-1">{resultCount}</strong> Learn More
        </span>

        {/* Mobile Filter Button */}
        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="course-filter-panel"
          className="lg:hidden flex flex-1 sm:flex-none items-center justify-center gap-2 h-12 px-4 bg-white border border-primary-300 rounded-lg text-primary-900 font-bold hover:bg-primary-50 transition-colors shadow-sm sm:w-auto"
        >
          <Filter className="w-5 h-5" />
          <span>{filtersOpen ? 'Learn More' : 'Learn More'}</span>
        </button>

        <div className="flex flex-1 items-center gap-3 sm:w-auto">
          <span className="text-sm font-medium text-primary-600 hidden sm:block">Sort:</span>
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-white border border-primary-300 rounded-lg pl-10 pr-4 py-2.5 h-12 text-sm font-bold text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer shadow-sm"
              value={filters.sort}
              onChange={(event) => onChange({ ...filters, sort: event.target.value as CourseCatalogFilters['sort'] })}
            >
              <option value="newest">Learn More</option>
              <option value="price-asc">Price: Learn More</option>
              <option value="price-desc">Price: Learn More</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

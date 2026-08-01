import React, { useState, useEffect } from 'react';
import { CourseCard } from '../ui/CourseCard';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from './Pagination';
import { Button } from '../ui/Button';
import { CourseCatalogFilters, EMPTY_CATALOG_FILTERS } from '../../lib/courseCatalog';
import { usePricingContext } from '../../contexts/PricingContext';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { mapCourseToCardProps } from '../../lib/courseCard';

interface CourseGridProps {
  filters: CourseCatalogFilters;
  onFiltersChange: (filters: CourseCatalogFilters) => void;
  onResultCountChange: (count: number) => void;
}

export function CourseGrid({ filters, onFiltersChange, onResultCountChange }: CourseGridProps) {
  const pageSize = 9;
  const navigate = useNavigate();
  const pricingContext = usePricingContext();
  const [currentPage, setCurrentPage] = useState(1);
  const { courses, totalCount, isLoading, error, refetch } = useCourseCatalog({
    filters,
    page: currentPage,
    pageSize,
    pricingContext,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    onResultCountChange(totalCount);
  }, [totalCount, onResultCountChange]);

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-700 font-bold">Loading the course catalog…</p>
        <p className="mt-1 text-sm text-primary-500">Finding the best matches for you.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-danger-50 text-danger-600 px-6 py-6 rounded-xl border border-danger-200 text-center max-w-md">
          <p className="font-bold mb-4">We could not load the course catalog. Please try again.</p>
          <Button variant="primary" onClick={refetch} className="mx-auto flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.categories.length || filters.levels.length ||
    filters.price !== 'all' || filters.durations.length,
  );

  if (courses.length === 0 && !hasActiveFilters) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-primary-50 text-primary-600 px-6 py-8 rounded-xl border border-primary-200 text-center max-w-md w-full">
          <p className="font-bold mb-2">No courses are available yet</p>
          <p>New courses are being prepared. Please check back soon.</p>
        </div>
      </div>
    );
  }

  const appliedFilters = [
    ...filters.categories.map(value => ({ label: value, clear: () => onFiltersChange({ ...filters, categories: filters.categories.filter(item => item !== value) }) })),
    ...filters.levels.map(value => ({ label: ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as Record<string, string>)[value] || value, clear: () => onFiltersChange({ ...filters, levels: filters.levels.filter(item => item !== value) }) })),
    ...(filters.price === 'all' ? [] : [{ label: filters.price === 'free' ? 'Free' : 'Paid', clear: () => onFiltersChange({ ...filters, price: 'all' }) }]),
    ...filters.durations.map(value => ({ label: ({ short: 'Under 5 hours', medium: '5–20 hours', long: 'Over 20 hours' } as Record<string, string>)[value], clear: () => onFiltersChange({ ...filters, durations: filters.durations.filter(item => item !== value) }) })),
    ...(filters.search ? [{ label: `Search: ${filters.search}`, clear: () => onFiltersChange({ ...filters, search: '' }) }] : []),
  ];

  return (
    <div className="flex-grow">
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm font-bold text-primary-900 me-2">Active filters:</span>
          {appliedFilters.map(item => (
            <button type="button" key={item.label} onClick={item.clear} className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100">
              {item.label}<X className="w-4 h-4 text-primary-400" />
            </button>
          ))}
          <button type="button" onClick={() => onFiltersChange(EMPTY_CATALOG_FILTERS)} className="text-sm font-bold text-accent-600">Clear all</button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="py-20 text-center"><p className="text-lg font-bold text-primary-900">No courses match these filters</p><p className="mt-1 text-primary-500">Try broadening your search or clearing the selected filters.</p><button type="button" onClick={() => onFiltersChange(EMPTY_CATALOG_FILTERS)} className="mt-3 font-semibold text-accent-700 hover:text-accent-800">Clear filters</button></div>
      ) : (
        <>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {courses.map(course => (
          <CourseCard key={course.id} {...mapCourseToCardProps(course, pricingContext, {
            ctaText: 'View course',
            onEnroll: () => navigate(`/course/${course.id}`),
          })} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
        </>
      )}
    </div>
  );
}

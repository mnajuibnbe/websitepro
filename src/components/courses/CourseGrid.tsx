import React, { useState, useEffect } from 'react';
import { CourseCard } from '../ui/CourseCard';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from './Pagination';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { PUBLIC_COURSE_STATUS } from '../../lib/courseVisibility';
import { CourseCatalogFilters, EMPTY_CATALOG_FILTERS, filterAndSortCourses } from '../../lib/courseCatalog';
import type { Course } from '../../types/database.types';

interface CourseGridProps {
  filters: CourseCatalogFilters;
  onFiltersChange: (filters: CourseCatalogFilters) => void;
  onResultCountChange: (count: number) => void;
}

export function CourseGrid({ filters, onFiltersChange, onResultCountChange }: CourseGridProps) {
  const pageSize = 9;
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, []);

  const visibleCourses = filterAndSortCourses(courses, filters);

  useEffect(() => {
    setCurrentPage(1);
    onResultCountChange(visibleCourses.length);
  }, [filters, courses, visibleCourses.length, onResultCountChange]);

  async function fetchCourses() {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('courses')
        .select('*')
        .eq('status', PUBLIC_COURSE_STATUS)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setCourses(data || []);
      setCurrentPage(1);
    } catch (err) {
      setError('Unable to load courses. Please try again.');
      console.error('Error fetching courses:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-600 font-medium">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-danger-50 text-danger-600 px-6 py-6 rounded-xl border border-danger-200 text-center max-w-md">
          <p className="font-bold mb-4">{error}</p>
          <Button variant="primary" onClick={fetchCourses} className="mx-auto flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-primary-50 text-primary-600 px-6 py-8 rounded-xl border border-primary-200 text-center max-w-md w-full">
          <p className="font-bold mb-2">No items found</p>
          <p>Try adjusting your search or clearing one or more filters.</p>
        </div>
      </div>
    );
  }

  const appliedFilters = [
    ...filters.categories.map(value => ({ label: value, clear: () => onFiltersChange({ ...filters, categories: filters.categories.filter(item => item !== value) }) })),
    ...filters.levels.map(value => ({ label: ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as Record<string, string>)[value] || value, clear: () => onFiltersChange({ ...filters, levels: filters.levels.filter(item => item !== value) }) })),
    ...(filters.price === 'all' ? [] : [{ label: filters.price === 'free' ? 'Free' : 'Paid', clear: () => onFiltersChange({ ...filters, price: 'all' }) }]),
    ...filters.durations.map(value => ({ label: ({ short: 'Under 5 Hours', medium: '5–20 Hours', long: 'Over 20 Hours' } as Record<string, string>)[value], clear: () => onFiltersChange({ ...filters, durations: filters.durations.filter(item => item !== value) }) })),
    ...(filters.search ? [{ label: `Search: ${filters.search}`, clear: () => onFiltersChange({ ...filters, search: '' }) }] : []),
  ];

  return (
    <div className="flex-grow">
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm font-bold text-primary-900 ml-2">Active Filters:</span>
          {appliedFilters.map(item => (
            <button type="button" key={item.label} onClick={item.clear} className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100">
              {item.label}<X className="w-4 h-4 text-primary-400" />
            </button>
          ))}
          <button type="button" onClick={() => onFiltersChange(EMPTY_CATALOG_FILTERS)} className="text-sm font-bold text-accent-600">Course Information</button>
        </div>
      )}

      {visibleCourses.length === 0 ? (
        <div className="py-20 text-center text-primary-600 font-bold">No items are available yet..</div>
      ) : (
        <>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {visibleCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(course => (
          <CourseCard
            key={course.id}
            title={course.title}
            category="Course"
            description={course.description || course.short_description || ''}
            duration={course.duration || 'TBD'}
            lessonsCount={0}
            price={typeof course.price === 'number' ? course.price : parseFloat(course.price || '0')}
            imageUrl={course.thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop'}
            ctaText="Course"
            onEnroll={() => navigate(`/course/${course.id}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(visibleCourses.length / pageSize)}
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

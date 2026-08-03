import React from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePricingContext } from '../../contexts/PricingContext';
import { PageContainer } from '../layout/PageContainer';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { mapCourseToCardProps } from '../../lib/courseCard';

export function FeaturedCourses() {
  const navigate = useNavigate();
  const pricingContext = usePricingContext();
  const { courses, isLoading, error, refetch } = useCourseCatalog({
    pageSize: 3,
    pricingContext,
    sort: 'featured',
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-white flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-24 bg-white flex flex-col gap-4 justify-center items-center">
        <p className="text-danger-600 font-bold">Unable to load featured courses. Please try again.</p>
        <Button variant="secondary" onClick={refetch} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
      <PageContainer>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-primary-600">
            Compare the curriculum, lesson depth, and price before choosing your next stage.
          </p>
        </div>

        {/* Courses Grid */}
        <div className={`grid grid-cols-1 gap-8 mb-12 md:grid-cols-2 ${courses.length < 3 ? 'mx-auto max-w-5xl' : 'lg:grid-cols-3'}`}>
          {courses.map(course => (
            <CourseCard key={course.id} {...mapCourseToCardProps(course, pricingContext, {
              ctaText: 'View Course',
              onEnroll: () => navigate(`/course/${course.id}`),
            })} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            View all courses
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

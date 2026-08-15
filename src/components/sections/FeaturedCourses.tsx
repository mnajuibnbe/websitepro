import React from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { usePricingContext } from '../../contexts/PricingContext';
import { PageContainer } from '../layout/PageContainer';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { mapCourseToCardProps } from '../../lib/courseCard';
import { Reveal } from '../ui/Reveal';

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
      <section className="flex items-center justify-center bg-primary-50 py-section md:py-section-lg">
        <Loader2 className="h-10 w-10 animate-spin text-accent-600" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 bg-primary-50 py-section md:py-section-lg">
        <p className="font-bold text-danger-600">Unable to load featured courses. Please try again.</p>
        <Button variant="secondary" onClick={refetch} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
        </Button>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="bg-primary-50 py-section md:py-section-lg">
      <PageContainer>

        {/* Section Header */}
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Featured Courses</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight text-primary-900 md:text-5xl">
            Start with our <span className="italic text-accent-700">featured</span> courses.
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-primary-600">
            Compare the curriculum, lesson depth, and price before choosing your next stage.
          </p>
        </Reveal>

        {/* Courses Grid */}
        <div className={`mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 ${courses.length < 3 ? 'mx-auto max-w-5xl' : 'lg:grid-cols-3'}`}>
          {courses.map((course, index) => {
            const cardProps = mapCourseToCardProps(course, pricingContext);
            return (
              <React.Fragment key={course.id}>
                <Reveal delay={index * 0.06} className="h-full">
                  <CourseCard {...cardProps} ctaText="Add to cart" fullWidthCta onEnroll={() => navigate(`/course/${course.id}`)} />
                </Reveal>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            Compare all courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

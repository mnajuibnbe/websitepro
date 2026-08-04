import React from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { usePricingContext } from '../../contexts/PricingContext';
import { PageContainer } from '../layout/PageContainer';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { mapCourseToCardProps } from '../../lib/courseCard';
import { formatHomepageCourseCta } from '../../lib/homepageMarketing';
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
    <section className="bg-white py-20 md:py-28">
      <PageContainer>

        {/* Section Header */}
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Featured Courses</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-primary-900 md:text-5xl">
            Start with our <span className="italic text-accent-700">most trusted</span> courses.
          </h2>
          <p className="mt-5 text-lg text-primary-600">
            Compare the curriculum, lesson depth, and price before choosing your next stage.
          </p>
        </Reveal>

        {/* Courses Grid */}
        <div className={`mb-14 grid grid-cols-1 gap-8 md:grid-cols-2 ${courses.length < 3 ? 'mx-auto max-w-5xl' : 'lg:grid-cols-3'}`}>
          {courses.map((course, index) => {
            const cardProps = mapCourseToCardProps(course, pricingContext);
            return (
              <React.Fragment key={course.id}>
                <Reveal delay={index * 0.08}>
                  <CourseCard {...cardProps} ctaText={formatHomepageCourseCta(course.title, cardProps.price)} fullWidthCta onEnroll={() => navigate(`/course/${course.id}`)} />
                </Reveal>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            View all courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

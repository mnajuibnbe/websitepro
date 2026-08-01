import React, { useState, useEffect } from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, RefreshCw } from 'lucide-react';
import { PUBLIC_COURSE_STATUS } from '../../lib/courseVisibility';
import { usePricingContext } from '../../contexts/PricingContext';
import { PageContainer } from '../layout/PageContainer';
import { resolveCoursePrice } from '../../lib/pricing';

export function FeaturedCourses() {
  const navigate = useNavigate();
  const pricingContext = usePricingContext();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedCourses() {
      try {
        setIsLoading(true);
        setError(null);
        // Explicit Admin order wins; courses without an order remain newest-first.
        // The same returned array is rendered on mobile and desktop.
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', PUBLIC_COURSE_STATUS)
          .order('home_order', { ascending: true, nullsFirst: false })
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error("Error fetching featured courses", err);
        setError('Unable to load featured courses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeaturedCourses();
  }, []);

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
        <p className="text-danger-600 font-bold">{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()} className="flex items-center gap-2">
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
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-primary-600">
            Choose a course that matches your professional goals and start learning today.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              title={course.title}
              category="Course"
              description={course.description}
              duration="TBD"
              lessonsCount={0}
              price={resolveCoursePrice(course, pricingContext).formatted}
              imageUrl={course.thumbnail || "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"}
              ctaText="View Course"
              onEnroll={() => navigate(`/course/${course.id}`)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            Courses
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

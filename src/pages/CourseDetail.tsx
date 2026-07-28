import React, { useEffect, useState } from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CourseHero } from '../components/course-detail/CourseHero';
import { EnrollmentCard } from '../components/course-detail/EnrollmentCard';
import { LearningOutcomes } from '../components/course-detail/LearningOutcomes';
import { WhoIsThisFor } from '../components/course-detail/WhoIsThisFor';
import { Requirements } from '../components/course-detail/Requirements';
import { CurriculumAccordion } from '../components/course-detail/CurriculumAccordion';
import { CourseInstructor } from '../components/course-detail/CourseInstructor';
import { CourseReviews } from '../components/course-detail/CourseReviews';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { isValidUUID } from '../lib/uuid';
import { Button } from '../components/ui/Button';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'invalid_uuid' | 'not_found' | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setIsLoading(true);
        setErrorState(null);

        if (!id || !isValidUUID(id)) {
          setErrorState('invalid_uuid');
          return;
        }

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setErrorState('not_found');
          return;
        }

        setCourse(data);
      } catch (err) {
        console.error('Error fetching course:', err);
        setErrorState('not_found');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketingNavbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-accent-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketingNavbar />
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-danger-500 mb-6" />
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            {errorState === 'invalid_uuid' ? 'Invalid Course Link' : 'Course Unavailable'}
          </h1>
          <p className="text-lg text-primary-600 mb-8 max-w-md">
            {errorState === 'invalid_uuid'
              ? 'This course link is invalid.'
              : 'Course details could not be loaded. Please try again.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/courses')} className="px-8">
            Courses
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />

      <main className="flex-grow pt-24 md:pt-32 pb-32 lg:pb-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative items-start">

            {/* Content Area (8 columns on Desktop) */}
            <div className="lg:col-span-8 order-1">
              <CourseHero course={course} />

              {/* Additional content sections */}
              <LearningOutcomes />
              <WhoIsThisFor />
              <Requirements />
              <CurriculumAccordion />
              <CourseInstructor />
              <CourseReviews />
            </div>

            {/* Sidebar Area (4 columns on Desktop) */}
            <div className="lg:col-span-4 order-2">
              <EnrollmentCard />
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

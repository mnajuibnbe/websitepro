import React, { useEffect, useState } from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CourseHero } from '../components/course-detail/CourseHero';
import { EnrollmentCard } from '../components/course-detail/EnrollmentCard';
import { LearningOutcomes } from '../components/course-detail/LearningOutcomes';
import { WhoIsThisFor } from '../components/course-detail/WhoIsThisFor';
import { Requirements } from '../components/course-detail/Requirements';
import { CurriculumAccordion, PublicCurriculumSection } from '../components/course-detail/CurriculumAccordion';
import { CourseInstructor, PublicInstructorProfile } from '../components/course-detail/CourseInstructor';
import { CourseReviews, PublicCourseReview } from '../components/course-detail/CourseReviews';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { isValidUUID } from '../lib/uuid';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/layout/PageContainer';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import type { CoursePreviewLesson } from '../components/course-detail/CourseMediaLightbox';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState<PublicCurriculumSection[]>([]);
  const [instructor, setInstructor] = useState<PublicInstructorProfile | null>(null);
  const [reviews, setReviews] = useState<PublicCourseReview[]>([]);
  const [previewLesson, setPreviewLesson] = useState<CoursePreviewLesson | null>(null);
  const [relatedDataLoading, setRelatedDataLoading] = useState(false);
  const [relatedDataError, setRelatedDataError] = useState(false);
  const validCourseId = Boolean(id && isValidUUID(id));
  const { courses, isLoading: courseLoading, error: courseError } = useCourseCatalog({
    enabled: validCourseId,
    id: validCourseId ? id : undefined,
    pageSize: 1,
  });
  const course = courses[0] || null;

  useEffect(() => {
    async function fetchRelatedCourseData() {
      try {
        if (!id || !validCourseId) return;
        setRelatedDataLoading(true);
        setRelatedDataError(false);

        const [curriculumResult, instructorResult, reviewsResult, previewResult] = await Promise.all([
          supabase.rpc('get_public_course_curriculum', { p_course_id: id }),
          supabase.rpc('get_public_course_instructor', { p_course_id: id }),
          supabase.rpc('get_public_course_reviews', { p_course_id: id, p_limit: 12 }),
          supabase.rpc('get_public_course_preview', { p_course_id: id }),
        ]);
        if (curriculumResult.error) throw curriculumResult.error;
        setCurriculum((curriculumResult.data || []) as PublicCurriculumSection[]);
        if (instructorResult.error) throw instructorResult.error;
        setInstructor((instructorResult.data || null) as PublicInstructorProfile | null);
        if (reviewsResult.error) throw reviewsResult.error;
        setReviews((reviewsResult.data || []) as PublicCourseReview[]);
        if (previewResult.error) throw previewResult.error;
        setPreviewLesson(((previewResult.data || [])[0] || null) as CoursePreviewLesson | null);
      } catch (err) {
        console.error('Error fetching course:', err);
        setRelatedDataError(true);
      } finally {
        setRelatedDataLoading(false);
      }
    }

    fetchRelatedCourseData();
  }, [id, validCourseId]);

  const isLoading = validCourseId && (courseLoading || relatedDataLoading);
  const errorState = !validCourseId
    ? 'invalid_uuid'
    : (!isLoading && (courseError || !course || relatedDataError) ? 'not_found' : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketingNavbar />
        <main id="main-content" className="flex-grow flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-accent-600 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketingNavbar />
        <main id="main-content" className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-danger-500 mb-6" />
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            {errorState === 'invalid_uuid' ? 'Invalid course link' : 'Course not found'}
          </h1>
          <p className="text-lg text-primary-600 mb-8 max-w-md">
            {errorState === 'invalid_uuid'
              ? 'This course link is invalid. Browse the course catalog to find the right course.'
              : 'The requested information could not be loaded. Please try again.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/courses')} className="px-8">
            Courses
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />

      <main id="main-content" className="flex-grow pt-24 md:pt-32 pb-32 lg:pb-24">
        <PageContainer>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative items-start">

            {/* Content Area (8 columns on Desktop) */}
            <div className="lg:col-span-8 order-1">
              <CourseHero course={course} />

              {/* Additional content sections */}
              <LearningOutcomes outcomes={course.learning_outcomes || []} />
              <WhoIsThisFor audiences={course.target_audience || []} />
              <Requirements requirements={course.requirements || []} />
              <div id="course-curriculum"><CurriculumAccordion sections={curriculum} /></div>
              <CourseInstructor instructor={instructor} />
              <CourseReviews reviews={reviews} />
            </div>

            {/* Sidebar Area (4 columns on Desktop) */}
            <div className="lg:col-span-4 order-2">
              <EnrollmentCard course={course} previewLesson={previewLesson} />
            </div>

          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}

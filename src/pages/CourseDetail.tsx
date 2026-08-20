import React, { useEffect, useState } from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CourseHero } from '../components/course-detail/CourseHero';
import { EnrollmentCard } from '../components/course-detail/EnrollmentCard';
import { LearningOutcomes } from '../components/course-detail/LearningOutcomes';
import { FromScienceToProducts } from '../components/course-detail/FromScienceToProducts';
import { CourseFitSection } from '../components/course-detail/CourseFitSection';
import { CurriculumAccordion, PublicCurriculumSection } from '../components/course-detail/CurriculumAccordion';
import { CourseInstructor, PublicInstructorProfile } from '../components/course-detail/CourseInstructor';
import { CourseTestimonials } from '../components/course-detail/CourseTestimonials';
import { CourseAbout } from '../components/course-detail/CourseAbout';
import { CourseReviews, PublicCourseReview } from '../components/course-detail/CourseReviews';
import { CourseFAQ } from '../components/course-detail/CourseFAQ';
import { CourseFinalCTA } from '../components/course-detail/CourseFinalCTA';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { isValidUUID } from '../lib/uuid';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/layout/PageContainer';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import type { CoursePreviewLesson } from '../components/course-detail/CourseMediaLightbox';
import { applyPageMeta, setStructuredData, SITE_NAME } from '../components/layout/PageMeta';
import { usePricingContext } from '../contexts/PricingContext';
import { resolveCoursePrice } from '../lib/pricing';
import { trackCourseDetailViewed } from '../lib/analytics';
import { fetchCourseTestimonials, type CourseTestimonial } from '../services/courseTestimonials.service';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState<PublicCurriculumSection[]>([]);
  const [instructor, setInstructor] = useState<PublicInstructorProfile | null>(null);
  const [reviews, setReviews] = useState<PublicCourseReview[]>([]);
  const [previewLesson, setPreviewLesson] = useState<CoursePreviewLesson | null>(null);
  const [testimonials, setTestimonials] = useState<CourseTestimonial[]>([]);
  const [relatedDataLoading, setRelatedDataLoading] = useState(false);
  const [relatedDataError, setRelatedDataError] = useState(false);
  const validCourseId = Boolean(id && isValidUUID(id));
  const { courses, isLoading: courseLoading, error: courseError } = useCourseCatalog({
    enabled: validCourseId,
    id: validCourseId ? id : undefined,
    pageSize: 1,
  });
  const course = courses[0] || null;
  const pricingContext = usePricingContext();

  useEffect(() => {
    const url = `${window.location.origin}/course/${id ?? ''}`;

    if (!validCourseId || (!courseLoading && !course)) {
      applyPageMeta({
        title: `Course Not Found | ${SITE_NAME}`,
        description: 'This course link is invalid or the course is no longer available. Browse the Tutiba course catalog to find the right course.',
        url,
        robots: 'noindex, follow',
      });
      setStructuredData('structured-data-course', null);
      return;
    }

    if (!course) return;

    const title = course.seo_title || `${course.title} | ${SITE_NAME}`;
    const description = course.seo_description || course.short_description || course.description || `${course.title} — a professional cosmeceutical course from Tutiba.`;
    const image = course.cover_image || undefined;

    applyPageMeta({ title, description, url, image });

    const price = resolveCoursePrice(course, pricingContext);
    setStructuredData('structured-data-course', {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description,
      url,
      ...(image ? { image } : {}),
      provider: { '@type': 'Organization', name: SITE_NAME, sameAs: window.location.origin },
      ...(price.available ? { offers: { '@type': 'Offer', price: price.amount, priceCurrency: price.currency, url, availability: 'https://schema.org/InStock' } } : {}),
      // Native Tutiba reviews only. Verified external ratings (e.g. Udemy) are shown
      // transparently in the UI but are never merged into this course's structured data.
      ...(course.reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: course.rating, reviewCount: course.reviewCount } } : {}),
    });

    return () => setStructuredData('structured-data-course', null);
  }, [course, courseLoading, validCourseId, id, pricingContext]);

  useEffect(() => {
    async function fetchRelatedCourseData() {
      try {
        if (!id || !validCourseId) return;
        setRelatedDataLoading(true);
        setRelatedDataError(false);

        const [curriculumResult, instructorResult, reviewsResult, previewResult, testimonialsResult] = await Promise.all([
          supabase.rpc('get_public_course_curriculum', { p_course_id: id }),
          supabase.rpc('get_public_course_instructor', { p_course_id: id }),
          supabase.rpc('get_public_course_reviews', { p_course_id: id, p_limit: 12 }),
          supabase.rpc('get_public_course_preview', { p_course_id: id }),
          fetchCourseTestimonials(),
        ]);
        if (curriculumResult.error) throw curriculumResult.error;
        setCurriculum((curriculumResult.data || []) as PublicCurriculumSection[]);
        if (instructorResult.error) throw instructorResult.error;
        setInstructor((instructorResult.data || null) as PublicInstructorProfile | null);
        if (reviewsResult.error) throw reviewsResult.error;
        setReviews((reviewsResult.data || []) as PublicCourseReview[]);
        if (previewResult.error) throw previewResult.error;
        setPreviewLesson(((previewResult.data || [])[0] || null) as CoursePreviewLesson | null);
        setTestimonials(testimonialsResult);
      } catch (err) {
        console.error('Error fetching course:', err);
        setRelatedDataError(true);
      } finally {
        setRelatedDataLoading(false);
      }
    }

    fetchRelatedCourseData();
  }, [id, validCourseId]);

  useEffect(() => {
    if (course) trackCourseDetailViewed(course.id);
  }, [course?.id]);

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

  const hasPreviewMedia = Boolean(course.trailer_video?.trim() || previewLesson);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />

      <main id="main-content" className="flex-grow pt-24 md:pt-32 pb-32 lg:pb-24">
        <PageContainer>

          {/* Purchase / decision zone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 lg:mb-16">
            <div className="lg:col-span-8 order-1">
              <CourseHero course={course} hasPreviewMedia={hasPreviewMedia} />
            </div>
            <div className="lg:col-span-4 order-2">
              <EnrollmentCard course={course} previewLesson={previewLesson} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12 md:mb-16">
            <LearningOutcomes outcomes={course.learning_outcomes || []} />
            <FromScienceToProducts />
          </div>

          <CourseFitSection audiences={course.target_audience || []} requirements={course.requirements || []} />

          <div id="course-curriculum">
            <CurriculumAccordion sections={curriculum} />
          </div>

          <CourseInstructor instructor={instructor} />
          <CourseTestimonials testimonials={testimonials} />
          <CourseAbout description={course.description} />
          <CourseReviews reviews={reviews} />
          <CourseFAQ language={course.language} hasPreviewMedia={hasPreviewMedia} requirements={course.requirements || []} />
          <CourseFinalCTA hasPreviewMedia={hasPreviewMedia} language={course.language} />

        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}

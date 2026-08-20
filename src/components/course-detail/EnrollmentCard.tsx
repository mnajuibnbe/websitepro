import { useAuth } from '../../contexts/AuthContext';
import { usePricingContext } from '../../contexts/PricingContext';
import { resolveCoursePrice } from '../../lib/pricing';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { ShieldCheck, Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isValidUUID } from '../../lib/uuid';
import { OptimizedImage } from '../ui/OptimizedImage';
import type { CourseCatalogItem } from '../../services/courseCatalog.service';
import { resolveCourseImageUrl } from '../../lib/courseCard';
import { CourseMediaLightbox, type CoursePreviewLesson } from './CourseMediaLightbox';
import { trackCheckoutStarted, trackCoursePreviewStarted, trackCourseContentViewed } from '../../lib/analytics';

function videoDurationLabel(totalSeconds: number): string | null {
  if (totalSeconds <= 0) return null;
  const hours = Math.round((totalSeconds / 3600) * 10) / 10;
  if (hours < 1) return `${Math.max(1, Math.round(totalSeconds / 60))} minutes of video`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hour${hours === 1 ? '' : 's'} of video`;
}

export function EnrollmentCard({ course, previewLesson }: { course: CourseCatalogItem; previewLesson: CoursePreviewLesson | null }) {
  const { user } = useAuth();
  const pricingContext = usePricingContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'none' | 'pending' | 'active' | 'cancelled'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorState, setErrorState] = useState<'invalid_uuid' | 'not_found' | 'already_enrolled' | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const primaryCtaRef = useRef<HTMLDivElement>(null);
  const [primaryCtaVisible, setPrimaryCtaVisible] = useState(true);
  const hasBeenSeenRef = useRef(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        setIsLoading(true);
        setErrorState(null);

        if (!id) {
          setErrorState('invalid_uuid');
          return;
        }

        if (!isValidUUID(id)) {
          setErrorState('invalid_uuid');
          return;
        }

        if (course.id !== id) {
          setErrorState('not_found');
          return;
        }

        setCourseId(id);

        // Check enrollment if user is logged in
        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('status')
            .eq('course_id', id)
            .eq('user_id', user.id)
            .single();

          if (enrollment) {
            setEnrollmentStatus(enrollment.status as 'pending' | 'active' | 'cancelled');
          }
        }
      } catch (err) {
        console.error("Error checking enrollment:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [course.id, id, user]);

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // The sticky bar only replaces the CTA once the visitor has scrolled past the real
    // card -- not merely because it hasn't been reached yet (it starts below the fold on
    // narrower layouts, since the card renders after the hero there).
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) hasBeenSeenRef.current = true;
      setPrimaryCtaVisible(entry.isIntersecting || !hasBeenSeenRef.current);
    }, { rootMargin: '0px 0px -1px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading, errorState]);

  const handleEnroll = async () => {
    if (!courseId) return;

    try {
      setIsEnrolling(true);
      setErrorState(null);

      if (!user) {
        navigate('/login', { state: { from: `/course/${courseId}` } });
        return;
      }
      trackCheckoutStarted(courseId);
      navigate('/checkout', { state: { courseId, course } });

    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const openPreview = () => {
    setMediaOpen(true);
    if (courseId) trackCoursePreviewStarted(courseId);
  };

  const scrollToCurriculum = () => {
    document.getElementById('course-curriculum')?.scrollIntoView({ behavior: 'smooth' });
    if (courseId) trackCourseContentViewed(courseId);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl shadow-lg p-12 flex justify-center items-center lg:sticky lg:top-28">
        <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
      </div>
    );
  }

  if (errorState === 'invalid_uuid' || errorState === 'not_found') {
    return (
      <div className="bg-white border border-danger-200 rounded-2xl shadow-lg p-8 flex flex-col justify-center items-center text-center lg:sticky lg:top-28">
        <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
        <h3 className="text-xl font-bold text-danger-900 mb-2">Enrollment Information</h3>
        <p className="text-danger-600 mb-6">
          {errorState === 'invalid_uuid' ? 'This course link is invalid.' : 'This course is unavailable or no longer published.'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/courses')} className="w-full">
          Browse courses
        </Button>
      </div>
    );
  }

  const renderButtonContent = () => {
    if (isEnrolling) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;
    if (enrollmentStatus === 'active') return 'Continue learning';
    if (enrollmentStatus === 'pending') return 'Pending Approval';
    if (enrollmentStatus === 'cancelled') return 'Apply again';
    return 'Enroll now';
  };

  const handleButtonClick = () => {
    if (enrollmentStatus === 'active') {
      navigate(`/learn/${courseId}`);
    } else if (enrollmentStatus === 'none' || enrollmentStatus === 'cancelled') {
      handleEnroll();
    }
  };

  const price = resolveCoursePrice(course, pricingContext);
  const hasPreviewMedia = Boolean(course.trailer_video?.trim() || previewLesson);
  const totalSeconds = Number(course.total_video_duration_seconds || 0);
  const durationOfVideo = videoDurationLabel(totalSeconds);

  const includes: string[] = [];
  if (course.language?.trim()) includes.push(`${course.language.trim()}-taught lessons`);
  if (durationOfVideo) includes.push(durationOfVideo);
  if (course.lessonsCount > 0) includes.push(`${course.lessonsCount} ${course.lessonsCount === 1 ? 'lesson' : 'lessons'}`);
  includes.push('Lifetime access');
  includes.push('Watch on mobile or desktop');
  if (course.certificate_enabled) includes.push('Free certificate of completion available on request');

  return (
    <>
      {showToast && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-success-200 text-success-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 text-success-600" />
          <p className="font-bold">Your enrollment request was submitted.</p>
        </div>
      )}

      {errorState === 'already_enrolled' && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-warning-200 text-warning-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <AlertCircle className="w-6 h-6 text-warning-600" />
          <p className="font-bold">You already have an enrollment for this course.</p>
        </div>
      )}

      <div id="enrollment-card" className="bg-white border border-primary-200 rounded-panel shadow-lg overflow-hidden lg:sticky lg:top-28 mb-8 lg:mb-0">
        {/* Course media */}
        <div className="relative aspect-video bg-primary-100">
          <OptimizedImage
            src={resolveCourseImageUrl(course)}
            alt={course.title || "Enrollment Information"}
            width="800"
            height="450"
            displayWidth={800}
            className="w-full h-full object-cover"
          />
          {hasPreviewMedia && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary-900/20">
            <button type="button" aria-label="Preview a lesson" onClick={openPreview} className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-accent-600 hover:scale-105 hover:bg-white transition-all shadow-xl">
              <Play className="w-6 h-6 fill-current ms-1" />
            </button>
            <span className="text-sm font-bold text-white drop-shadow">Preview a lesson</span>
          </div>}
        </div>

        {/* Card Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary-900">{price.formatted}</span>
          </div>

          {/* CTAs */}
          <div ref={primaryCtaRef} className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              className="w-full h-12 text-base"
              onClick={handleButtonClick}
              disabled={!price.available || isEnrolling || enrollmentStatus === 'pending'}
            >
              {renderButtonContent()}
            </Button>
            {hasPreviewMedia && <Button variant="secondary" onClick={openPreview} className="w-full h-12 text-base bg-white">
              Preview a lesson
            </Button>}
            <button type="button" onClick={scrollToCurriculum} className="text-center font-bold text-accent-700 hover:text-accent-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded">
              See course content ↓
            </button>
          </div>

          {/* Enrollment Information List */}
          <div>
            <p className="mb-2.5 font-bold text-primary-900">This course includes:</p>
            <ul className="space-y-2.5 text-primary-700 font-medium">
              {includes.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-accent-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-between gap-2 border-t border-primary-100 pt-4 text-sm">
            <span className="flex items-center gap-2 text-primary-500 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Secure checkout
            </span>
            <Link to="/refund-policy" className="font-bold text-accent-700 hover:text-accent-800">Refund policy</Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - only once the primary CTA has scrolled out of view */}
      {!primaryCtaVisible && <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-200 p-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary-900 leading-none">{price.formatted}</span>
        </div>
        <Button
          variant="primary"
          className="flex-grow h-12 text-lg font-bold"
          onClick={handleButtonClick}
          disabled={!price.available || isEnrolling || enrollmentStatus === 'pending'}
        >
          {renderButtonContent()}
        </Button>
      </div>}
      <CourseMediaLightbox open={mediaOpen} onClose={() => setMediaOpen(false)} courseId={course.id} courseTitle={course.title} trailerUrl={course.trailer_video} previewLesson={previewLesson} poster={resolveCourseImageUrl(course)} />
    </>
  );
}

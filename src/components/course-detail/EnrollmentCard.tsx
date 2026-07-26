import { useAuth } from '../../contexts/AuthContext';
import { usePricingContext } from '../../contexts/PricingContext';
import { resolveCoursePrice } from '../../lib/pricing';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BookOpen, Clock, Award, ShieldCheck, Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { isValidUUID } from '../../lib/uuid';

export function EnrollmentCard() {
  const { user } = useAuth();
  const pricingContext = usePricingContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'none' | 'pending' | 'active' | 'cancelled'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorState, setErrorState] = useState<'invalid_uuid' | 'not_found' | 'already_enrolled' | null>(null);

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

        // Verify course exists
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError || !course) {
          setErrorState('not_found');
          return;
        }

        setCourseId(id);
        setCourseDetails(course);

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
  }, [id, user]);

  const handleEnroll = async () => {
    if (!courseId) return;

    try {
      setIsEnrolling(true);
      setErrorState(null);

      if (!user) {
        navigate('/login');
        return;
      }

      navigate(`/checkout?courseId=${encodeURIComponent(courseId)}`);

    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
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
        <h3 className="text-xl font-bold text-danger-900 mb-2">Learn More</h3>
        <p className="text-danger-600 mb-6">
          {errorState === 'invalid_uuid' ? 'Link.' : 'Course.'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/courses')} className="w-full">
          Back
        </Button>
      </div>
    );
  }

  const renderButtonContent = () => {
    if (isEnrolling) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;
    if (enrollmentStatus === 'active') return 'Lesson (Subscribe)';
    if (enrollmentStatus === 'pending') return 'Pending Approval';
    if (enrollmentStatus === 'cancelled') return 'Order';
    return 'Learn More';
  };

  const handleButtonClick = () => {
    if (enrollmentStatus === 'active') {
      navigate(`/learn/${courseId}`);
    } else if (enrollmentStatus === 'none') {
      handleEnroll();
    }
  };

  const price = resolveCoursePrice(courseDetails || {}, pricingContext);

  return (
    <>
      {showToast && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-success-200 text-success-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 text-success-600" />
          <p className="font-bold">Submit. Course.</p>
        </div>
      )}

      {errorState === 'already_enrolled' && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-warning-200 text-warning-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <AlertCircle className="w-6 h-6 text-warning-600" />
          <p className="font-bold">Build practical skills with structured, expert-led course content..</p>
        </div>
      )}

      <div className="bg-white border border-primary-200 rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-28 mb-8 lg:mb-0">
        {/* Course Image */}
      <div className="relative aspect-video bg-primary-100">
        <img
          src={courseDetails?.thumbnail || "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"}
          alt={courseDetails?.title || "Learn More"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/20 flex items-center justify-center">
          <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-accent-600 hover:scale-105 hover:bg-white transition-all shadow-xl">
            <Play className="w-6 h-6 fill-current ms-1" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 md:p-8 flex flex-col gap-6">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary-900">{price.formatted}</span>
        </div>

        {/* Details List */}
        <ul className="space-y-4 text-primary-700 font-medium">
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span>Beginner</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>Lessons</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span>Learn More</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <span>Learn More</span>
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="primary"
            className="w-full h-14 text-lg"
            onClick={handleButtonClick}
            disabled={!price.available || isEnrolling || enrollmentStatus === 'pending' || enrollmentStatus === 'cancelled'}
          >
            {renderButtonContent()}
          </Button>
          <Button variant="secondary" className="w-full h-14 text-lg bg-white" icon={<Play className="w-4 h-4 fill-current" />}>
            Lesson
          </Button>
        </div>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-sm text-primary-500 font-medium mt-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Learn More 30 Learn More</span>
        </div>
      </div>
    </div>

    {/* Mobile Sticky Bottom Bar */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-200 p-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-primary-900 leading-none">{price.formatted}</span>
      </div>
      <Button
        variant="primary"
        className="flex-grow h-12 text-lg font-bold"
        onClick={handleButtonClick}
        disabled={!price.available || isEnrolling || enrollmentStatus === 'pending' || enrollmentStatus === 'cancelled'}
      >
        {renderButtonContent()}
      </Button>
    </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BookOpen, Clock, Award, ShieldCheck, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

export function EnrollmentCard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<string | null>(id || null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'none' | 'pending' | 'active'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        setIsLoading(true);
        let targetCourseId = id;
        
        if (!targetCourseId) {
          const { data: firstCourse } = await supabase
            .from('courses')
            .select('id')
            .limit(1)
            .single();
          if (firstCourse) {
            targetCourseId = firstCourse.id;
          }
        }
        
        if (targetCourseId) {
          setCourseId(targetCourseId);
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: enrollment } = await supabase
              .from('enrollments')
              .select('status')
              .eq('course_id', targetCourseId)
              .eq('user_id', session.user.id)
              .single();
              
            if (enrollment) {
              setEnrollmentStatus(enrollment.status as 'pending' | 'active');
            }
          }
        }
      } catch (err) {
        console.error("Error checking enrollment:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkStatus();
  }, [id]);

  const handleEnroll = async () => {
    if (!courseId) return;
    try {
      setIsEnrolling(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: session.user.id,
          course_id: courseId,
          status: 'pending'
        });

      if (error) {
        console.error("Enrollment error:", error);
        return;
      }

      setEnrollmentStatus('pending');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const renderButtonContent = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;
    if (enrollmentStatus === 'active') return 'الذهاب للدرس (تم الاشتراك)';
    if (enrollmentStatus === 'pending') return 'الطلب قيد المراجعة';
    return isEnrolling ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'سجلي الآن';
  };

  const handleButtonClick = () => {
    if (enrollmentStatus === 'active') {
      navigate(`/lesson?courseId=${courseId}`);
    } else if (enrollmentStatus === 'none') {
      handleEnroll();
    }
  };

  return (
    <>
      {showToast && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-success-200 text-success-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 text-success-600" />
          <p className="font-bold">تم إرسال طلبك بنجاح. سيتم تفعيل الكورس بمجرد تأكيد الدفع.</p>
        </div>
      )}

      <div className="bg-white border border-primary-200 rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-28 mb-8 lg:mb-0">
        {/* Course Image */}
      <div className="relative aspect-video bg-primary-100">
        <img 
          src="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop" 
          alt="دبلومة العناية بالبشرة" 
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
          <span className="text-4xl font-bold text-primary-900">$199</span>
          <span className="text-lg text-primary-400 line-through">$249</span>
        </div>

        {/* Details List */}
        <ul className="space-y-4 text-primary-700 font-medium">
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span>مستوى مبتدئ إلى متوسط</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>45 درس مسجل</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span>80 ساعة تعليمية</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <span>شهادة إتمام معتمدة</span>
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mt-2">
          <Button 
            variant="primary" 
            className="w-full h-14 text-lg"
            onClick={handleButtonClick}
            disabled={isLoading || isEnrolling || enrollmentStatus === 'pending'}
          >
            {renderButtonContent()}
          </Button>
          <Button variant="secondary" className="w-full h-14 text-lg bg-white" icon={<Play className="w-4 h-4 fill-current" />}>
            شاهدي درسًا مجانيًا
          </Button>
        </div>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-sm text-primary-500 font-medium mt-2">
          <ShieldCheck className="w-4 h-4" />
          <span>سياسة استرجاع مضمونة لمدة 30 يوم</span>
        </div>
      </div>
    </div>

    {/* Mobile Sticky Bottom Bar */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-200 p-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm text-primary-500 line-through font-medium leading-none mb-1">$249</span>
        <span className="text-2xl font-bold text-primary-900 leading-none">$199</span>
      </div>
      <Button 
        variant="primary" 
        className="flex-grow h-12 text-lg font-bold"
        onClick={handleButtonClick}
        disabled={isLoading || isEnrolling || enrollmentStatus === 'pending'}
      >
        {renderButtonContent()}
      </Button>
    </div>
    </>
  );
}

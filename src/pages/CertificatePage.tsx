import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, Copy, Loader2, Printer, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCoursesProgress } from '../lib/courseProgress';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { CertificatePreview } from '../components/certificate/CertificatePreview';
import { PageContainer } from '../components/layout/PageContainer';

type CertificateStatus = 'idle' | 'loading' | 'eligible' | 'ineligible' | 'error';

export function CertificatePage() {
  const { user } = useAuth();
  const location = useLocation();
  const stateCourseId = (location.state as { courseId?: string } | null)?.courseId;
  const queryCourseId = new URLSearchParams(location.search).get('course') || undefined;
  const courseId = stateCourseId || queryCourseId;
  const [status, setStatus] = useState<CertificateStatus>(courseId ? 'loading' : 'idle');
  const [course, setCourse] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!courseId || !user) return;
    const verify = async () => {
      setStatus('loading');
      const [{ data, error }, progress] = await Promise.all([
        supabase.from('courses').select('id,title,certificate_enabled,updated_at').eq('id', courseId).maybeSingle(),
        fetchCoursesProgress(user.id, [courseId]),
      ]);
      if (error || !data) { setStatus('error'); return; }
      setCourse(data);
      const courseProgress = progress[courseId];
      setStatus(data.certificate_enabled && courseProgress?.totalLessons > 0 && courseProgress.percentage === 100 ? 'eligible' : 'ineligible');
    };
    verify().catch(() => setStatus('error'));
  }, [courseId, user]);

  const certificateId = courseId && user ? `TUT-${courseId.slice(0, 8).toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}` : '';
  const verificationUrl = courseId ? `${window.location.origin}${window.location.pathname}#/certificate?course=${encodeURIComponent(courseId)}` : '';
  const completionDate = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date());

  const copyVerificationLink = async () => {
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-30 border-b border-primary-200 bg-white"><PageContainer className="flex h-16 items-center justify-between"><Link to="/my-courses" className="flex min-h-11 items-center gap-2 font-semibold text-primary-600 hover:text-accent-700"><ArrowLeft className="h-5 w-5" aria-hidden="true" />My Courses</Link><span className="font-bold text-primary-900">Certificates</span><span className="w-10" /></PageContainer></header>
      <main id="main-content" className="py-12">
        <PageContainer>
        {status === 'loading' && <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-accent-600" aria-label="Verifying certificate eligibility" /></div>}
        {status === 'idle' && <section className="mx-auto max-w-xl rounded-2xl border border-primary-200 bg-white p-10 text-center shadow-sm"><Award className="mx-auto mb-5 h-14 w-14 text-accent-600" /><h1 className="mb-3 text-3xl font-bold text-primary-900">Your certificates</h1><p className="mb-7 text-primary-600">Certificates become available from My Courses after you complete every published lesson in an eligible course.</p><Link to="/my-courses" className="font-bold text-accent-700">View course progress</Link></section>}
        {(status === 'ineligible' || status === 'error') && <section role="status" className="mx-auto max-w-xl rounded-2xl border border-primary-200 bg-white p-10 text-center shadow-sm"><ShieldCheck className="mx-auto mb-5 h-14 w-14 text-primary-400" /><h1 className="mb-3 text-2xl font-bold text-primary-900">Certificate not available</h1><p className="mb-7 text-primary-600">{status === 'error' ? 'We could not verify this certificate. Please try again later.' : 'Complete all published lessons and assessments. The course must also have certificates enabled.'}</p><Link to="/my-courses" className="font-bold text-accent-700">Return to My Courses</Link></section>}
        {status === 'eligible' && course && <div>
          <div className="mb-8 text-center"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success-100 px-4 py-2 font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" />Completion verified</div><h1 className="text-3xl font-bold text-primary-900 md:text-4xl">Certificate of completion</h1><p className="mt-3 text-primary-600">Eligibility was verified against your current course progress.</p></div>
          <div className="grid items-start gap-8 lg:grid-cols-12"><div className="lg:col-span-8"><CertificatePreview studentName={user?.name || 'Learner'} courseName={course.title} completionDate={completionDate} certificateId={certificateId} instructorName="Tutiba Education" /></div><aside className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm lg:col-span-4"><h2 className="mb-5 text-xl font-bold text-primary-900">Certificate details</h2><dl className="mb-6 space-y-4 text-sm"><div><dt className="text-primary-500">Certificate ID</dt><dd className="break-all font-mono font-semibold text-primary-900">{certificateId}</dd></div><div><dt className="text-primary-500">Course</dt><dd className="font-semibold text-primary-900">{course.title}</dd></div><div><dt className="text-primary-500">Issued to</dt><dd className="font-semibold text-primary-900">{user?.name}</dd></div></dl><div className="space-y-3"><Button className="w-full" variant="primary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print or save PDF</Button><Button className="w-full" variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={copyVerificationLink}>{copied ? 'Link copied' : 'Copy verification link'}</Button></div><p className="mt-5 text-xs leading-relaxed text-primary-500">Opening the verification link requires the certificate owner to sign in, protecting private learning records.</p></aside></div>
        </div>}
        </PageContainer>
      </main>
    </div>
  );
}

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { CheckCircle2, BookOpen, Award, Play } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { IntroVideoModal } from '../video/IntroVideoModal';
import { useHomepagePreviewLessons } from '../../hooks/useHomepageMarketing';
import { PRIMARY_DIPLOMA_CTA, PRIMARY_DIPLOMA_PATH } from '../../lib/homepageMarketing';

export function HeroSection() {
  const navigate = useNavigate();
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const { data: previewLessons, isLoading: isPreviewLoading } = useHomepagePreviewLessons();
  const previewLesson = previewLessons[0];
  const closeIntro = useCallback(() => setIsIntroOpen(false), []);

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-primary-50">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100 text-accent-800 text-sm font-bold mb-6 uppercase tracking-wider">
              Professional Cosmeceutical Education
            </span>

            <h1 className="mb-6 font-sans text-4xl font-bold text-primary-900 md:text-display">
              Master Cosmeceuticals <br className="hidden md:block" />
              with Scientific Confidence
            </h1>

            <p className="text-lg md:text-xl text-primary-600 mb-10 leading-relaxed max-w-xl">
              Start with skin structure, hyaluronic acid, collagen, and product evaluation in a diploma built for health and beauty professionals.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-12">
              <Button variant="primary" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate(PRIMARY_DIPLOMA_PATH)}>
                {PRIMARY_DIPLOMA_CTA}
              </Button>
              <Button variant="secondary" disabled={!previewLesson} className="w-full sm:w-auto text-lg h-14 bg-white" icon={<Play className="w-4 h-4 fill-current" />} onClick={() => previewLesson && setIsIntroOpen(true)}>
                {isPreviewLoading ? 'Loading Preview…' : 'Watch a Real Lesson'}
              </Button>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-primary-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-600" />
                <span>Evidence-based content</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-600" />
                <span>Expert-led courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span>Verified certificates</span>
              </div>
            </div>
          </div>

          {/* Visual Content */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-3xl border border-primary-700 bg-primary-900 shadow-xl">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-300/10 blur-3xl" />
              <div className="relative flex h-full flex-col items-center justify-center px-8 text-center text-white">
                <span className="mb-5 rounded-full border border-accent-300/30 bg-accent-500/10 px-4 py-2 text-xs font-bold uppercase tracking-eyebrow text-accent-200">Free lesson preview</span>
                <h2 className="max-w-md text-2xl font-bold leading-tight text-white md:text-3xl">Preview the teaching before you enroll.</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-300 md:text-base">Open a complete lesson selected by the Tutiba team and see the scientific depth for yourself.</p>
                <button type="button" disabled={!previewLesson} aria-label="Play a free Tutiba lesson" onClick={() => previewLesson && setIsIntroOpen(true)} className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-white text-accent-700 shadow-2xl transition-all hover:scale-105 hover:bg-accent-50 focus:outline-none focus:ring-4 focus:ring-accent-300/50 disabled:cursor-wait disabled:opacity-60">
                  <Play className="h-8 w-8 fill-current ms-1" />
                </button>
                <span className="mt-4 text-sm font-bold text-accent-100">Play lesson</span>
              </div>
            </div>
          </div>

        </div>
      </PageContainer>
      <IntroVideoModal
        isOpen={isIntroOpen}
        onClose={closeIntro}
        lessonId={previewLesson?.lessonId}
        eyebrow="Free diploma lesson"
        title={previewLesson?.lessonTitle || 'Tutiba lesson preview'}
        description={previewLesson ? `From ${previewLesson.courseTitle}` : 'A Tutiba lesson preview is being prepared.'}
      />
    </section>
  );
}

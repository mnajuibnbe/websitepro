import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';
import { IntroVideoModal } from '../video/IntroVideoModal';
import { Reveal } from '../ui/Reveal';
import { useHomepagePreviewLessons, usePrimaryDiplomaOffer } from '../../hooks/useHomepageMarketing';

export function FinalCTA() {
  const navigate = useNavigate();
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const { data: previewLessons } = useHomepagePreviewLessons();
  const { ctaText, coursePath } = usePrimaryDiplomaOffer();
  const previewLesson = previewLessons[0];
  const closeIntro = useCallback(() => setIsIntroOpen(false), []);
  return (
    <section className="relative overflow-hidden bg-primary-900 py-20 text-center text-white md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(50%_50%_at_50%_0%,black,transparent)]"
      >
        <svg width="100%" height="100%" className="h-full w-full">
          <defs>
            <pattern id="final-cta-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" className="fill-accent-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#final-cta-dot-grid)" />
        </svg>
      </div>
      <PageContainer className="relative">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="mb-6 font-display text-4xl font-semibold text-white md:text-6xl">
              Ready to advance your <span className="italic text-accent-300">cosmeceutical career?</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-primary-300 md:text-xl">
              Begin Part 1 with six published lessons covering skin structure, hyaluronic acid, and real product evaluation.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button variant="primary" onClick={() => navigate(coursePath)} className="h-14 border-none bg-accent-500 px-8 text-lg text-primary-900 shadow-lg shadow-accent-500/20 transition-all duration-300 hover:bg-accent-400 hover:shadow-xl">
                {ctaText}
              </Button>
              <Button variant="secondary" disabled={!previewLesson} onClick={() => previewLesson && setIsIntroOpen(true)} className="h-14 border-primary-600 px-8 text-lg text-white transition-all duration-300 hover:border-primary-500 hover:bg-primary-800">
                Watch a Free Lesson
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-primary-300">
              <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-accent-300" aria-hidden="true" /><span>Staged diploma structure</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-300" aria-hidden="true" /><span>Secure checkout</span></div>
            </div>
          </Reveal>
        </div>
      </PageContainer>
      <IntroVideoModal
        isOpen={isIntroOpen}
        onClose={closeIntro}
        lessonId={previewLesson?.lessonId}
        eyebrow="Free course preview"
        title={previewLesson?.lessonTitle || 'Tutiba lesson preview'}
        description={previewLesson ? `Watch a complete lesson from ${previewLesson.courseTitle}.` : 'A Tutiba lesson preview is being prepared.'}
      />
    </section>
  );
}

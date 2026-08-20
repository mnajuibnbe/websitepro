import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';
import { IntroVideoModal } from '../video/IntroVideoModal';
import { Reveal } from '../ui/Reveal';
import { useHomepagePreviewLessons } from '../../hooks/useHomepageMarketing';

export function FinalCTA() {
  const navigate = useNavigate();
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const { data: previewLessons } = useHomepagePreviewLessons();
  const previewLesson = previewLessons[0];
  const closeIntro = useCallback(() => setIsIntroOpen(false), []);
  return (
    <section className="relative overflow-hidden bg-primary-900 py-12 text-center text-white md:py-16">
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
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="mb-3 text-balance text-3xl font-bold leading-tight text-white md:text-4xl">
              Ready to start?
            </h2>
            <p className="mx-auto mb-7 max-w-2xl text-pretty leading-relaxed text-primary-300 md:text-lg">
              Browse the courses, preview a lesson, and choose the one that fits you.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="primary" onClick={() => navigate('/courses')} className="h-12 border-none bg-accent-500 px-7 text-base text-primary-900 shadow-lg shadow-accent-500/20 hover:bg-accent-400 hover:shadow-xl">
                Browse Courses
              </Button>
              <Button variant="secondary" disabled={!previewLesson} onClick={() => previewLesson && setIsIntroOpen(true)} className="h-12 border-primary-600 px-7 text-base text-white hover:border-primary-500 hover:bg-primary-800">
                Watch a Course Preview
              </Button>
            </div>
            <p className="mt-6 text-sm font-semibold text-primary-300">
              Courses taught in Arabic • Learn at your own pace
            </p>
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

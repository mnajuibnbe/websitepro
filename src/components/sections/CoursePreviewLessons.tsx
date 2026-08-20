import { useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { OptimizedImage } from '../ui/OptimizedImage';
import { IntroVideoModal } from '../video/IntroVideoModal';
import { useHomepagePreviewLessons } from '../../hooks/useHomepageMarketing';
import type { HomepagePreviewLesson } from '../../lib/homepageMarketing';

export function CoursePreviewLessons() {
  const { data: previewLessons, isLoading } = useHomepagePreviewLessons();
  const [activeLesson, setActiveLesson] = useState<HomepagePreviewLesson | null>(null);

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-10 md:py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  if (previewLessons.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-12">
      <PageContainer>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">Try before you enroll</p>
          <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">
            Preview real lessons from the course.
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-primary-600">
            Selected lessons are open to everyone, so you can check the teaching style and course quality before you buy.
          </p>
        </Reveal>

        <div className="mx-auto flex max-w-3xl flex-col divide-y divide-primary-100 overflow-hidden rounded-panel border border-primary-200 bg-white shadow-sm">
          {previewLessons.slice(0, 3).map((lesson, index) => (
            <Reveal key={lesson.lessonId} delay={index * 0.06}>
              <button
                type="button"
                onClick={() => setActiveLesson(lesson)}
                className="group flex w-full items-center gap-4 p-4 text-left transition-colors duration-200 ease-out hover:bg-accent-50/40 sm:p-5"
              >
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-card bg-primary-100 sm:h-20 sm:w-20">
                  {lesson.courseThumbnail ? (
                    <OptimizedImage src={lesson.courseThumbnail} alt="" displayWidth={160} width="160" height="160" priority className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-accent-50 text-accent-400"><PlayCircle className="h-6 w-6" /></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-primary-900/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-accent-700 shadow-sm transition-transform duration-200 ease-out group-hover:scale-110">
                      <PlayCircle className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold uppercase tracking-eyebrow text-accent-700">{lesson.courseTitle}</p>
                  <h3 className="mt-0.5 truncate text-base font-bold text-primary-900">{lesson.lessonTitle}</h3>
                </div>
                <span className="flex-none text-sm font-bold text-accent-700 group-hover:underline">Watch Preview</span>
              </button>
            </Reveal>
          ))}
        </div>
      </PageContainer>

      <IntroVideoModal
        isOpen={activeLesson !== null}
        onClose={() => setActiveLesson(null)}
        lessonId={activeLesson?.lessonId}
        eyebrow="Free course preview"
        title={activeLesson?.lessonTitle || 'Tutiba lesson preview'}
        description={activeLesson ? `Watch a complete lesson from ${activeLesson.courseTitle}.` : 'A Tutiba lesson preview is being prepared.'}
      />
    </section>
  );
}

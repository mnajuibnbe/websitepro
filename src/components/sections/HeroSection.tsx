import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, X } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { OptimizedImage } from '../ui/OptimizedImage';
import { SecureStreamProvider, prefetchSecureStream } from '../video/SecureStreamProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useHomepageHero, useHomepagePreviewLessons } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function HeroSection() {
  const navigate = useNavigate();
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const { data: hero } = useHomepageHero();
  const { data: previewLessons } = useHomepagePreviewLessons();
  const { token } = useAuth();
  const previewLesson = previewLessons[0];

  // Request the streaming token/URL as soon as the hero is visible and the real
  // preview lesson has loaded, well before the visitor clicks Play, so the click
  // starts playback immediately instead of waiting on the network round trip
  // (which also breaks unmuted autoplay once the click's user-activation window
  // has expired).
  useEffect(() => {
    if (previewLesson) prefetchSecureStream(previewLesson.lessonId, token);
  }, [previewLesson, token]);

  return (
    <section className="relative overflow-hidden bg-primary-50 pb-8 pt-28 md:pb-10 md:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_60%_at_20%_20%,black,transparent)]"
      >
        <svg width="100%" height="100%" className="h-full w-full">
          <defs>
            <pattern id="hero-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" className="fill-accent-300" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dot-grid)" />
        </svg>
      </div>

      <PageContainer className="relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left">
            <Reveal>
              <span className="mb-4 inline-block rounded-full bg-accent-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-800">
                {hero.eyebrowText}
              </span>
              <h1 className="mb-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-primary-900 md:text-5xl">
                {hero.headlinePrefix}, {hero.headlineHighlight}
              </h1>
              <p className="mb-6 max-w-xl text-pretty leading-relaxed text-primary-600 md:text-lg">
                {hero.subtext}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mb-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  variant="primary"
                  className="h-12 w-full justify-center text-base shadow-lg shadow-accent-600/20 sm:w-auto lg:h-14 lg:px-7"
                  onClick={() => navigate('/courses')}
                >
                  {hero.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="tertiary"
                  disabled={!previewLesson}
                  className="h-12 w-full justify-center text-base text-accent-700 hover:bg-accent-50 sm:w-auto lg:h-14 lg:px-5"
                  onClick={() => setIsPlayingIntro(true)}
                >
                  Watch a Course Preview
                </Button>
              </div>
              <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-primary-200 pt-4 text-sm font-semibold text-primary-700 lg:justify-start">
                {hero.trustBadges.map(badge => {
                  const BadgeIcon = resolveHomepageIcon(badge.icon);
                  return <div key={badge.label} className="flex items-center gap-1.5"><BadgeIcon className="h-4 w-4 text-accent-600" /><span>{badge.label}</span></div>;
                })}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="relative lg:col-span-7">
            <div className="relative rounded-frame bg-gradient-to-br from-accent-300/50 via-accent-100/30 to-transparent p-0.5 shadow-[0_30px_70px_-25px_rgba(13,148,136,0.45)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[calc(var(--radius-frame)-2px)] border border-primary-800 bg-primary-900">
                {isPlayingIntro && previewLesson ? (
                  <>
                    <div className="absolute inset-0">
                      <SecureStreamProvider lessonId={previewLesson.lessonId} title={previewLesson.lessonTitle} publicPreview autoPlay fill controls="playback-only" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlayingIntro(false)}
                      aria-label="Back to course preview cover"
                      className="absolute right-3 top-3 z-20 flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-primary-900/80 px-3 text-xs font-bold text-white shadow-lg backdrop-blur transition-colors duration-200 ease-out hover:bg-primary-900 focus:outline-none focus:ring-4 focus:ring-accent-300/60 sm:right-4 sm:top-4 sm:h-11 sm:px-4 sm:text-sm"
                    >
                      <X className="h-4 w-4" /> Back
                    </button>
                  </>
                ) : (
                  <>
                    {previewLesson?.courseThumbnail && (
                      <OptimizedImage
                        src={previewLesson.courseThumbnail}
                        alt=""
                        displayWidth={900}
                        priority
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-900/85 to-primary-900/20" />
                    <div className="absolute inset-0 flex flex-col justify-center px-6 py-6 text-white sm:max-w-[60%] sm:px-8">
                      <span className="mb-3 inline-flex w-fit rounded-full border border-accent-300/30 bg-accent-500/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-eyebrow text-accent-200">
                        {hero.videoBadgeText}
                      </span>
                      <h2 className="max-w-md text-xl font-bold leading-tight text-white md:text-2xl">
                        {previewLesson?.lessonTitle || hero.videoHeading}
                      </h2>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-300">
                        {previewLesson ? `From ${previewLesson.courseTitle}.` : hero.videoDescription}
                      </p>
                      <button
                        type="button"
                        aria-label="Play the course preview video"
                        disabled={!previewLesson}
                        onClick={() => setIsPlayingIntro(true)}
                        className="mt-5 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white text-accent-700 shadow-2xl transition-[transform,background-color] duration-200 ease-out hover:scale-105 hover:bg-accent-50 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent-300/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play className="h-6 w-6 fill-current ms-1" />
                      </button>
                      <span className="mt-3 text-xs font-bold text-accent-100">{hero.videoPlayLabel}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </PageContainer>
    </section>
  );
}

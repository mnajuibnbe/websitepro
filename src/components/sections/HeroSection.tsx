import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Play, RefreshCw, X } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { SecureStreamProvider, prefetchHomepageIntroStream } from '../video/SecureStreamProvider';

export function HeroSection() {
  const navigate = useNavigate();
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Request the streaming token/URL as soon as the hero is visible, well before
  // the visitor clicks Play, so the click starts playback immediately instead of
  // waiting on the network round trip (which also breaks unmuted autoplay once
  // the click's user-activation window has expired).
  useEffect(() => { prefetchHomepageIntroStream(); }, []);

  return (
    <section className="relative overflow-hidden bg-primary-50 pb-16 pt-32 md:pb-20 md:pt-40">
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
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">
            <Reveal>
              <span className="mb-6 inline-block rounded-full bg-accent-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-accent-800">
                For Skincare &amp; Cosmeceutical Professionals
              </span>
              <h1 className="mb-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-primary-900 md:text-6xl lg:text-7xl">
                Turn ingredient science into <span className="italic text-accent-700">decisions you can defend.</span>
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-primary-600 md:text-xl lg:mb-12">
                Structured, evidence-based courses in skin science and cosmeceutical ingredients — built for professionals who need to evaluate products and advise clients with confidence, not guesswork.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mb-12 flex w-full justify-center lg:mb-14 lg:justify-start">
                <Button
                  variant="primary"
                  className="h-14 w-full justify-center text-lg shadow-lg shadow-accent-600/20 sm:w-auto lg:h-16 lg:px-8 lg:text-xl"
                  onClick={() => navigate('/courses')}
                >
                  See Courses &amp; Pricing <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-primary-700 lg:justify-start">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent-600" /><span>Evidence-based content</span></div>
                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent-600" /><span>Expert-led courses</span></div>
                <div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-accent-600" /><span>Lifetime course access</span></div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="relative lg:col-span-6">
            <div className="relative rounded-[2rem] bg-gradient-to-br from-accent-300/50 via-accent-100/30 to-transparent p-[3px] shadow-[0_30px_70px_-25px_rgba(13,148,136,0.45)]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[calc(2rem-3px)] border border-primary-800 bg-primary-900 sm:aspect-[4/3] lg:aspect-square">
                {isPlayingIntro ? (
                  <>
                    <div className="absolute inset-0">
                      <SecureStreamProvider asset="homepage-intro" title="Welcome to Tutiba" publicPreview autoPlay fill controls="playback-only" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlayingIntro(false)}
                      aria-label="Back to welcome video cover"
                      className="absolute right-3 top-3 z-20 flex h-9 items-center gap-1.5 rounded-full bg-primary-900/80 px-3 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-primary-900 focus:outline-none focus:ring-4 focus:ring-accent-300/60 sm:right-4 sm:top-4 sm:h-11 sm:px-4 sm:text-sm"
                    >
                      <X className="h-4 w-4" /> Back
                    </button>
                  </>
                ) : (
                  <>
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-300/10 blur-3xl" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 text-center text-white sm:px-8">
                      <span className="mb-5 rounded-full border border-accent-300/30 bg-accent-500/10 px-4 py-2 text-xs font-bold uppercase tracking-eyebrow text-accent-200">
                        Welcome to Tutiba
                      </span>
                      <h2 className="max-w-md font-display text-2xl font-semibold leading-tight text-white md:text-3xl">
                        Meet your professional learning platform.
                      </h2>
                      <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-300 md:text-base">
                        A short look at how a Tutiba lesson connects the science to a real product decision.
                      </p>
                      <button
                        type="button"
                        aria-label="Play the Tutiba welcome video"
                        onClick={() => setIsPlayingIntro(true)}
                        className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-white text-accent-700 shadow-2xl transition-all hover:scale-105 hover:bg-accent-50 focus:outline-none focus:ring-4 focus:ring-accent-300/50 sm:h-20 sm:w-20"
                      >
                        <Play className="h-7 w-7 fill-current ms-1 sm:h-8 sm:w-8" />
                      </button>
                      <span className="mt-4 text-sm font-bold text-accent-100">Play welcome video</span>
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

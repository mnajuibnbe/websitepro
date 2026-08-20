import { FlaskConical, Loader2, Microscope } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { CountUp } from '../ui/CountUp';
import { useHomepageStats, useHomepageInstructor } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function InstructorSection() {
  const { data: stats, isLoading: statsLoading } = useHomepageStats();
  const { data: content, isLoading: instructorLoading } = useHomepageInstructor();

  if (statsLoading || instructorLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-10 md:py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-12">
      <PageContainer>
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:gap-8 lg:text-left">
          {/* Decorative science-icon badge — no portrait, purely supporting decoration. */}
          <Reveal className="relative flex-none">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-primary-200 bg-gradient-to-br from-primary-50 via-warning-50 to-accent-50 shadow-sm sm:h-28 sm:w-28">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]">
                <svg width="100%" height="100%" className="h-full w-full">
                  <defs>
                    <pattern id="instructor-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="1.2" cy="1.2" r="1.2" className="fill-accent-400" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#instructor-dot-grid)" />
                </svg>
              </div>
              <div className="relative flex items-center gap-1.5">
                <FlaskConical className="h-6 w-6 text-accent-400 sm:h-7 sm:w-7" aria-hidden="true" />
                <Microscope className="h-10 w-10 text-accent-700 sm:h-12 sm:w-12" aria-hidden="true" />
              </div>
            </div>
          </Reveal>

          {/* Instructor content */}
          <div className="min-w-0 flex-1">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">{content.eyebrowText}</p>
              <h2 className="mt-1 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">
                {content.headingPrefix} {content.headingHighlight}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-pretty leading-relaxed text-primary-600 lg:mx-0">
                {content.bio}
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold leading-none tracking-tight text-primary-900 tabular-nums">{content.experienceBadgeValue}</span>
                <span className="text-xs font-semibold uppercase leading-tight tracking-eyebrow text-primary-500">{content.experienceBadgeLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <CountUp value={stats.studentsValue} className="text-2xl font-bold leading-none tracking-tight text-primary-900 tabular-nums" />
                <span className="text-xs font-semibold uppercase leading-tight tracking-eyebrow text-primary-500">Students Taught</span>
              </div>
              {content.credentialPills.map(pill => {
                const PillIcon = resolveHomepageIcon(pill.icon);
                return (
                  <span key={pill.label} className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800">
                    <PillIcon className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" /> {pill.label}
                  </span>
                );
              })}
            </Reveal>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

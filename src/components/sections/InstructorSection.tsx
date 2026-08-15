import { CheckCircle2, GraduationCap, Microscope } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { CountUp } from '../ui/CountUp';
import { useHomepageStats } from '../../hooks/useHomepageMarketing';

export function InstructorSection() {
  const { data: stats } = useHomepageStats();

  return (
    <section className="bg-white py-section-sm md:py-section">
      <PageContainer>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">

          {/* Instructor brand (5 cols on Desktop) */}
          <Reveal className="relative order-2 lg:order-1 lg:col-span-5">
            <div className="aspect-square overflow-hidden rounded-frame border border-primary-200 bg-gradient-to-br from-primary-50 via-warning-50 to-accent-50 p-6 shadow-xl shadow-primary-900/5 sm:p-10">
              <OptimizedImage displayWidth={800} width="1600" height="1600"
                src="/images/tutiba-instructor-logo.png"
                alt="Dr. Aya Elbrashy — Skin, Hair and Beauty Nutrition"
                className="h-full w-full rounded-full object-contain drop-shadow-sm"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 hidden flex-col items-center justify-center gap-2 rounded-card border border-primary-200 bg-white p-5 text-center shadow-lg md:flex">
              <span className="font-display text-3xl font-semibold leading-none tracking-tight text-primary-900 tabular-nums">10+</span>
              <span className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Years of Experience</span>
            </div>
            <div className="absolute -left-4 -top-4 hidden flex-col items-center justify-center gap-2 rounded-card border border-primary-200 bg-white p-5 text-center shadow-lg md:flex">
              <CountUp value={stats.studentsValue} className="font-display text-3xl font-semibold leading-none tracking-tight text-primary-900 tabular-nums" />
              <span className="text-xs font-bold uppercase tracking-eyebrow text-primary-500">Students Taught</span>
            </div>
          </Reveal>

          {/* Instructor Content (7 cols on Desktop) */}
          <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:col-span-7 lg:items-start lg:text-left">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Your Instructor</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-primary-900 md:text-4xl">
                Meet <span className="italic text-accent-700">your instructor.</span>
              </h2>
              <p className="mx-auto mt-5 mb-8 max-w-2xl text-pretty text-lg leading-relaxed text-primary-600 lg:mx-0">
                Learn skin, hair, and beauty-nutrition science from an educator who has spent more than a decade turning research into decisions professionals use every day.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="w-full">
              <div className="mb-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
                  <GraduationCap className="h-4 w-4 text-accent-600" aria-hidden="true" /> Skin &amp; Beauty Nutrition Specialist
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
                  <Microscope className="h-4 w-4 text-accent-600" aria-hidden="true" /> Evidence-Based Curriculum
                </span>
              </div>

              <ul className="w-full divide-y divide-primary-100 border-y border-primary-100 font-medium text-primary-800">
                <li className="flex items-center justify-center gap-3 py-4 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
                  <span className="text-lg">Skin structure linked directly to cosmeceutical action</span>
                </li>
                <li className="flex items-center justify-center gap-3 py-4 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
                  <span className="text-lg">Ingredient and product comparisons you can apply</span>
                </li>
                <li className="flex items-center justify-center gap-3 py-4 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
                  <span className="text-lg">Structured diploma stages with visible progress</span>
                </li>
              </ul>
            </Reveal>
          </div>

        </div>
      </PageContainer>
    </section>
  );
}

import { CheckCircle2, GraduationCap, Microscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { CountUp } from '../ui/CountUp';
import { useHomepageStats } from '../../hooks/useHomepageMarketing';

export function InstructorSection() {
  const { data: stats } = useHomepageStats();

  return (
    <section className="border-t border-primary-100 bg-primary-50 py-20 md:py-28">
      <PageContainer>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">

          {/* Instructor brand (5 cols on Desktop) */}
          <Reveal className="relative order-2 lg:order-1 lg:col-span-5">
            <div className="aspect-square overflow-hidden rounded-[2.5rem] border border-primary-200 bg-gradient-to-br from-white via-[#fff8eb] to-accent-50 p-6 shadow-xl shadow-primary-900/5 sm:p-10">
              <OptimizedImage displayWidth={800} width="1600" height="1600"
                src="/images/tutiba-instructor-logo.png"
                alt="Dr. Aya Elbrashy — Skin, Hair and Beauty Nutrition"
                className="h-full w-full rounded-full object-contain drop-shadow-sm"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 hidden flex-col items-center justify-center gap-1 rounded-2xl border border-primary-100 bg-white p-5 text-center shadow-lg md:flex">
              <span className="text-3xl font-bold text-accent-600">10+</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">Years of Experience</span>
            </div>
            <div className="absolute -left-4 -top-4 hidden flex-col items-center justify-center gap-1 rounded-2xl border border-primary-100 bg-white p-5 text-center shadow-lg md:flex">
              <CountUp value={stats.studentsValue} className="text-3xl font-bold text-accent-600" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">Students Taught</span>
            </div>
          </Reveal>

          {/* Instructor Content (7 cols on Desktop) */}
          <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:col-span-7 lg:items-start lg:text-left">
            <Reveal>
              <span className="mb-6 inline-block rounded-full bg-accent-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-accent-800">
                Your Instructor
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mb-6 font-display text-4xl font-semibold leading-tight text-primary-900 md:text-5xl">
                Meet <span className="italic text-accent-700">your instructor.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-primary-600 lg:mx-0" style={{ fontSize: '1.125rem' }}>
                Build your skin, hair, and beauty-nutrition knowledge with an educator who has spent more than a decade translating scientific concepts into practical professional decisions.
              </p>
            </Reveal>

            <Reveal delay={0.18} className="mb-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-800">
                <GraduationCap className="h-4 w-4 text-accent-600" aria-hidden="true" /> Skin &amp; Beauty Nutrition Specialist
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-800">
                <Microscope className="h-4 w-4 text-accent-600" aria-hidden="true" /> Evidence-Based Curriculum
              </span>
            </Reveal>

            <Reveal delay={0.24}>
              <ul className="mb-10 w-full space-y-4 font-medium text-primary-800">
                <li className="flex items-center justify-center gap-3 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-accent-600" />
                  <span className="text-lg">Skin structure linked directly to cosmeceutical action</span>
                </li>
                <li className="flex items-center justify-center gap-3 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-accent-600" />
                  <span className="text-lg">Ingredient and product comparisons you can apply</span>
                </li>
                <li className="flex items-center justify-center gap-3 text-center lg:justify-start lg:text-left">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-accent-600" />
                  <span className="text-lg">Structured diploma stages with visible progress</span>
                </li>
              </ul>
            </Reveal>

            <Reveal delay={0.3} className="w-full">
              <Button variant="secondary" className="h-12 w-full px-8 text-lg sm:w-auto">
                Meet Your Instructor
              </Button>
            </Reveal>
          </div>

        </div>
      </PageContainer>
    </section>
  );
}

import { Award, Microscope, ScanSearch, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';

const outcomes = [
  {
    title: 'Certificate on completion',
    description: 'Eligible courses award a completion certificate once you finish the required lessons and assessments.',
    icon: Award,
  },
  {
    title: 'Evidence-based curriculum',
    description: 'Every lesson is grounded in current science and clear reasoning, not marketing claims.',
    icon: Microscope,
  },
  {
    title: 'Apply it immediately',
    description: 'Turn ingredient science into confident product evaluation and real professional decisions.',
    icon: ScanSearch,
  },
  {
    title: 'Secure enrollment',
    description: 'Your account and enrollment are protected by secure checkout and account workflows.',
    icon: ShieldCheck,
  },
];

export function OutcomesSection() {
  return (
    <section className="bg-primary-900 py-20 text-white md:py-28" aria-label="What you can expect from Tutiba">
      <PageContainer>
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-300">Why enroll with confidence</p>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Built so you can <span className="italic text-accent-300">learn, and use it.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} delay={index * 0.08} className="text-center sm:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-400/30 bg-accent-500/10 text-accent-300 sm:mx-0">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 leading-relaxed text-primary-300">{description}</p>
            </Reveal>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

import { Layers, Microscope, ScanSearch, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';

const outcomes = [
  {
    title: 'Clear course stages',
    description: 'Work through ordered stages — like Part 1 and Part 2 — so you always know what comes next.',
    icon: Layers,
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
    <section className="bg-primary-900 py-section text-white md:py-section-lg" aria-label="What you can expect from Tutiba">
      <PageContainer>
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-300">Why enroll with confidence</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight md:text-5xl">
            Built so you can <span className="italic text-accent-300">learn, and use it.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} delay={index * 0.06} className="border-t border-primary-700 pt-6 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-card border border-accent-400/30 bg-accent-500/10 text-accent-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-balance text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-pretty leading-relaxed text-primary-300">{description}</p>
            </Reveal>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

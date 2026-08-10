import { ArrowRight, BookOpenCheck, FlaskConical, ScanSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrimaryDiplomaOffer } from '../../hooks/useHomepageMarketing';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';

const curriculum = [
  {
    title: 'Skin layers and product targets',
    description: 'See how products intended for the dermis and hypodermis are evaluated against skin structure.',
    icon: ScanSearch,
  },
  {
    title: 'Hyaluronic acid by molecular size',
    description: 'Understand how molecular size changes penetration, effect, and the claims a formula can reasonably make.',
    icon: FlaskConical,
  },
  {
    title: 'From ingredient science to product comparison',
    description: 'Use the scientific foundation to compare finished products instead of relying on marketing categories alone.',
    icon: BookOpenCheck,
  },
];

export function LearningMethod() {
  const navigate = useNavigate();
  const { ctaText, coursePath } = usePrimaryDiplomaOffer();

  return (
    <section className="bg-white py-20 md:py-28">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          <div className="text-center lg:col-span-4 lg:text-left">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Featured curriculum</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-primary-900 md:text-5xl">Inside this featured course</h2>
              <p className="mx-auto mt-5 max-w-sm leading-relaxed text-primary-600 lg:mx-0">Part 1 moves from skin anatomy into hyaluronic-acid science, ingredient comparison, and product-level application.</p>
              <Button variant="secondary" className="mt-7 w-full px-6 sm:w-auto" onClick={() => navigate(coursePath)}>
                {ctaText} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Reveal>
          </div>

          <div className="relative lg:col-span-8">
            <div aria-hidden="true" className="absolute left-[7%] right-[7%] top-11 hidden h-px bg-primary-100 md:block" />
            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {curriculum.map(({ title, description, icon: Icon }, index) => (
                <Reveal key={title} delay={index * 0.1} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-100 bg-white text-accent-700 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mt-4 font-display text-4xl font-semibold text-primary-200" aria-hidden="true">0{index + 1}</span>
                  <h3 className="mt-2 text-lg font-bold text-primary-900">{title}</h3>
                  <p className="mt-3 leading-relaxed text-primary-600">{description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

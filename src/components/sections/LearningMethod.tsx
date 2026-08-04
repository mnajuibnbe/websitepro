import { ArrowRight, BookOpenCheck, FlaskConical, ScanSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrimaryDiplomaOffer } from '../../hooks/useHomepageMarketing';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';

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
    <section className="bg-white py-16 md:py-24">
      <PageContainer>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="text-center lg:col-span-4">
            <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Featured curriculum</p>
            <h2 className="mt-3 text-3xl font-bold text-primary-900 md:text-4xl">Inside This Featured Course</h2>
            <p className="mt-5 leading-relaxed text-primary-600">Part 1 moves from skin anatomy into hyaluronic-acid science, ingredient comparison, and product-level application.</p>
            <Button variant="secondary" className="mt-7 w-full px-6" onClick={() => navigate(coursePath)}>
              {ctaText} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:col-span-8">
            {curriculum.map(({ title, description, icon: Icon }, index) => (
              <article key={title} className="flex h-full flex-col items-center rounded-xl border border-primary-100 bg-primary-50 p-6 text-center md:p-7">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-accent-700 shadow-sm"><Icon className="h-5 w-5" /></div>
                  <span className="text-xs font-bold tracking-wider text-primary-400">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-primary-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-primary-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

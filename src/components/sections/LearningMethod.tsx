import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrimaryDiplomaOffer, useHomepageLearningMethodContent } from '../../hooks/useHomepageMarketing';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function LearningMethod() {
  const navigate = useNavigate();
  const { ctaText, coursePath } = usePrimaryDiplomaOffer();
  const { data: content } = useHomepageLearningMethodContent();

  return (
    <section className="bg-primary-50 py-section-sm md:py-section">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          <div className="text-center lg:col-span-4 lg:text-left">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">{content.eyebrowText}</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-primary-900 md:text-4xl">{content.heading}</h2>
              <p className="mx-auto mt-5 max-w-sm text-pretty leading-relaxed text-primary-600 lg:mx-0">{content.subtext}</p>
              <Button variant="secondary" className="mt-7 w-full px-6 sm:w-auto" onClick={() => navigate(coursePath)}>
                {ctaText} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            {/* Ordered stages: the hairline rule + numeral marks real curriculum
                order, and replaces the decorative connector line that never
                lined up with the icon centres. */}
            <ol className="grid gap-8 lg:grid-cols-3">
              {content.curriculum.map(({ title, description, icon: iconKey }, index) => {
                const Icon = resolveHomepageIcon(iconKey);
                return (
                <Reveal key={title} delay={index * 0.06} as="li" className="border-t border-primary-200 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-card border border-accent-100 bg-white text-accent-700 shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-2xl font-semibold leading-none tracking-tight text-primary-400 tabular-nums" aria-hidden="true">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-balance text-lg font-bold text-primary-900">{title}</h3>
                  <p className="mt-2 text-pretty leading-relaxed text-primary-600">{description}</p>
                </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

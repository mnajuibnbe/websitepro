import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { useHomepageWhyChooseUs } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function WhyChooseUs() {
  const navigate = useNavigate();
  const { data: content } = useHomepageWhyChooseUs();
  const features = content.features;
  const lastRowStart = features.length - (features.length % 2 === 0 ? 2 : 1);

  return (
    <section className="bg-white py-section-sm md:py-section">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="text-center lg:col-span-4 lg:text-left">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">{content.eyebrowText}</p>
                <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-primary-900 md:text-4xl">
                  {content.headingPrefix} <span className="italic text-accent-700">{content.headingHighlight}</span>
                </h2>
                <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-primary-600 lg:mx-0">
                  {content.subtext}
                </p>
                <Button variant="secondary" className="mt-8" onClick={() => navigate('/courses')}>
                  {content.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 border-t border-primary-100 sm:grid-cols-2">
              {features.map(({ title, description, icon: iconKey }, index) => {
                const Icon = resolveHomepageIcon(iconKey);
                const isLastRow = index >= lastRowStart;
                const isLeftCol = index % 2 === 0;
                return (
                  <Reveal
                    key={title}
                    delay={(index % 2) * 0.06}
                    className={`flex gap-4 py-7 ${isLastRow ? '' : 'border-b border-primary-100'} ${isLeftCol ? 'sm:border-r sm:border-primary-100 sm:pr-8' : 'sm:pl-8'}`}
                  >
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-card bg-accent-50 text-accent-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-primary-900">{title}</h3>
                      <p className="mt-2 text-pretty leading-relaxed text-primary-600">{description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

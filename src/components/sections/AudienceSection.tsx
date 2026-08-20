import { Loader2 } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageLearningMethodContent } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function AudienceSection() {
  const { data: content, isLoading } = useHomepageLearningMethodContent();

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-section-sm md:py-section">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-12">
      <PageContainer>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">{content.eyebrowText}</p>
          <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">
            {content.heading}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {content.curriculum.map(({ title, description, icon: iconKey }, index) => {
            const Icon = resolveHomepageIcon(iconKey);
            return (
              <Reveal
                key={title}
                delay={index * 0.06}
                className="rounded-panel border border-primary-200 bg-primary-50/60 p-6 shadow-sm transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-card bg-white text-accent-700 shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold text-primary-900">{title}</h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-primary-600">{description}</p>
              </Reveal>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

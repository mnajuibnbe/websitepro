import { Loader2 } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageOutcomes } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function OutcomesSection() {
  const { data: content, isLoading } = useHomepageOutcomes();

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-section-sm" aria-label="What you can expect from Tutiba">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  return (
    <section className="bg-white py-8 md:py-10" aria-label="What you can expect from Tutiba">
      <PageContainer>
        <Reveal className="mx-auto mb-6 max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">{content.eyebrowText}</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-primary-100">
          {content.outcomes.map(({ title, description, icon: iconKey }, index) => {
            const Icon = resolveHomepageIcon(iconKey);
            return (
              <Reveal key={title} delay={index * 0.06} className="text-left lg:px-5 lg:first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-card bg-accent-50 text-accent-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-balance text-sm font-bold text-primary-900">{title}</h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-primary-600">{description}</p>
              </Reveal>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

import { Loader2 } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageWhyChooseUs } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function WhyChooseUs() {
  const { data: content, isLoading } = useHomepageWhyChooseUs();
  const features = content.features;

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-10 md:py-12">
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
            {content.headingPrefix} {content.headingHighlight}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-primary-100">
          {features.map(({ title, description, icon: iconKey }, index) => {
            const Icon = resolveHomepageIcon(iconKey);
            return (
              <Reveal key={title} delay={index * 0.06} className="text-left lg:px-5 lg:first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-card bg-accent-50 text-accent-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-primary-900">{title}</h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-primary-600">{description}</p>
              </Reveal>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

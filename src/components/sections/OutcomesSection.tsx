import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageOutcomes } from '../../hooks/useHomepageMarketing';
import { resolveHomepageIcon } from '../../lib/homepageIcons';

export function OutcomesSection() {
  const { data: content } = useHomepageOutcomes();

  return (
    <section className="bg-primary-900 py-section text-white md:py-section-lg" aria-label="What you can expect from Tutiba">
      <PageContainer>
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-300">{content.eyebrowText}</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-tight md:text-5xl">
            {content.headingPrefix} <span className="italic text-accent-300">{content.headingHighlight}</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {content.outcomes.map(({ title, description, icon: iconKey }, index) => {
            const Icon = resolveHomepageIcon(iconKey);
            return (
              <Reveal key={title} delay={index * 0.06} className="border-t border-primary-700 pt-6 text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-card border border-accent-400/30 bg-accent-500/10 text-accent-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-balance text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-primary-300">{description}</p>
              </Reveal>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

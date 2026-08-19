import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageFaqEntries } from '../../hooks/useHomepageMarketing';

export function HomepageFAQ() {
  const { data: faqEntries } = useHomepageFaqEntries();

  return (
    <section className="bg-white py-section-sm md:py-section" aria-labelledby="homepage-faq-heading">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-14 text-center md:mb-16">
            <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Before you enroll</p>
            <h2 id="homepage-faq-heading" className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-primary-900 md:text-4xl">
              Questions, answered.
            </h2>
          </Reveal>

          <Reveal delay={0.06} className="space-y-3">
            {faqEntries.map((faq, index) => (
              <details key={faq.id} className="group rounded-panel border border-primary-200 bg-white shadow-sm transition-colors duration-200 ease-out hover:border-primary-300 open:border-primary-300 open:bg-primary-50 [&_summary::-webkit-details-marker]:hidden" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-panel p-5 font-bold text-primary-900 transition-colors duration-200 ease-out hover:text-accent-800 md:p-6">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 flex-none text-primary-400 transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-primary-200 px-5 pb-5 pt-4 text-pretty leading-relaxed text-primary-600 md:px-6 md:pb-6">
                  {faq.answer}
                </div>
              </details>
            ))}
          </Reveal>

          <p className="mt-10 text-center">
            <Link to="/faq" className="font-bold text-accent-700 underline-offset-4 transition-colors duration-200 ease-out hover:text-accent-800 hover:underline">
              View all frequently asked questions →
            </Link>
          </p>
        </div>
      </PageContainer>
    </section>
  );
}

import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { faqEntries } from '../../lib/faqContent';

export function HomepageFAQ() {
  return (
    <section className="bg-white py-20 md:py-28" aria-labelledby="homepage-faq-heading">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-10 text-center md:mb-12">
            <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Before you enroll</p>
            <h2 id="homepage-faq-heading" className="mt-3 font-display text-4xl font-semibold leading-tight text-primary-900 md:text-5xl">
              Questions, answered.
            </h2>
          </Reveal>

          <Reveal delay={0.08} className="space-y-3">
            {faqEntries.map((faq, index) => (
              <details key={faq.q} className="group rounded-2xl border border-primary-200 bg-white shadow-sm [&_summary::-webkit-details-marker]:hidden" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-primary-900 md:p-6">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 flex-none text-primary-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-primary-50 px-5 pb-5 pt-4 leading-relaxed text-primary-600 md:px-6 md:pb-6">
                  {faq.a}
                </div>
              </details>
            ))}
          </Reveal>

          <p className="mt-8 text-center">
            <Link to="/faq" className="font-bold text-accent-700 transition-colors hover:text-accent-800">
              View all frequently asked questions →
            </Link>
          </p>
        </div>
      </PageContainer>
    </section>
  );
}

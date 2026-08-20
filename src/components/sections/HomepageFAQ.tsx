import { ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../ui/Reveal';
import { useHomepageFaqEntries } from '../../hooks/useHomepageMarketing';

export function HomepageFAQ() {
  const { data: faqEntries, isLoading } = useHomepageFaqEntries();

  if (isLoading) {
    return (
      <section className="flex items-center justify-center bg-white py-10 md:py-12" aria-labelledby="homepage-faq-heading">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-12" aria-labelledby="homepage-faq-heading">
      <PageContainer>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">FAQ</p>
          <h2 id="homepage-faq-heading" className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={0.06} className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {faqEntries.map(faq => (
            <details key={faq.id} className="group rounded-panel border border-primary-200 bg-white shadow-sm transition-colors duration-200 ease-out hover:border-primary-300 open:border-primary-300 open:bg-primary-50 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-panel p-4 text-sm font-bold text-primary-900 transition-colors duration-200 ease-out hover:text-accent-800">
                {faq.question}
                <ChevronDown className="h-4 w-4 flex-none text-primary-400 transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-primary-200 px-4 pb-4 pt-3 text-pretty text-sm leading-relaxed text-primary-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </Reveal>

        <p className="mt-8 text-center">
          <Link to="/faq" className="font-bold text-accent-700 underline-offset-4 transition-colors duration-200 ease-out hover:text-accent-800 hover:underline">
            View all frequently asked questions →
          </Link>
        </p>
      </PageContainer>
    </section>
  );
}

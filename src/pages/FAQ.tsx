import React, { useEffect } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { useHomepageFaqEntries } from '../hooks/useHomepageMarketing';

export function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: faqs } = useHomepageFaqEntries();

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main id="main-content" className="pt-32 pb-24">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-accent-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-primary-600">Find clear answers about courses, enrollment, payments, and certificates.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.id} className="group bg-white rounded-2xl border border-primary-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-primary-900">
                  {faq.question}
                  <ChevronDown className="w-5 h-5 text-primary-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-primary-600 leading-relaxed border-t border-primary-50 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}

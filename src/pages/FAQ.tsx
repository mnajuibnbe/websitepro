import React, { useEffect } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

export function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      q: "Who are Tutiba courses designed for?",
      a: "Our courses are designed for health, beauty, and skincare professionals who want structured, evidence-based cosmeceutical education. Each course page lists its specific prerequisites."
    },
    {
      q: "Will I receive a certificate?",
      a: "Eligible courses award a completion certificate after you finish the required lessons and assessments. Certificate availability is shown on each course page."
    },
    {
      q: "Which payment methods are available?",
      a: "Available payment methods and the final billing currency are shown securely at checkout before you confirm your purchase."
    },
    {
      q: "How do I get technical support?",
      a: "Use the Contact page to describe the issue and include the email address associated with your account. Our support team will follow up as soon as possible."
    }
  ];

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
            <h1 className="text-4xl font-bold text-primary-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-primary-600">Find clear answers about courses, enrollment, payments, and certificates.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-2xl border border-primary-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-primary-900">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-primary-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-primary-600 leading-relaxed border-t border-primary-50 pt-4">
                  {faq.a}
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

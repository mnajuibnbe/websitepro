import React, { useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

export function RefundPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main id="main-content" className="pt-32 pb-24">
        <PageContainer>
          <div className="mx-auto max-w-4xl">
          <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">Refund & Cancellation Policy</h1>
                <p className="text-primary-600">Last updated: August 14, 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. All Sales Are Final</h2>
                <p className="leading-relaxed">
                  All course purchases on Tutiba are final. We do not offer refunds, credits, or exchanges once a
                  purchase is completed. Every course is a digital product delivered instantly upon payment
                  approval, granting immediate access to the full curriculum. Because delivery is instant and
                  complete at the moment of purchase, there is no partially-used or returnable product to reverse.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. Why We Have This Policy</h2>
                <p className="leading-relaxed">
                  This is standard practice across digital educational platforms, and it exists to keep pricing fair
                  for every learner rather than to limit your options. Two things make a no-refund policy workable
                  and fair for digital courses:
                </p>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>
                    <strong>Instant, irrevocable access:</strong> unlike a physical product, a digital course cannot
                    be "returned" once viewed — access to the video lessons and materials is granted the moment
                    payment is approved.
                  </li>
                  <li>
                    <strong>You can evaluate fit before you pay:</strong> every course page publishes its full
                    curriculum outline along with free preview lessons you can watch in advance, so you can assess
                    the instructor, teaching style, and content depth before enrolling.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. Before You Purchase</h2>
                <p className="leading-relaxed">
                  Because all sales are final, we encourage you to evaluate each course carefully before checkout.
                  Every course detail page gives you the tools to do this:
                </p>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>Watch the free preview lessons available on the course page.</li>
                  <li>Review the full curriculum and lesson outline before enrolling.</li>
                  <li>Read the course description, level, and prerequisites to confirm it matches your background and goals.</li>
                  <li>Contact our support team with any pre-purchase questions about course content or suitability.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. Exceptions</h2>
                <p className="leading-relaxed">
                  The no-refund policy above is subject to the following narrow exceptions:
                </p>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>
                    <strong>Duplicate or erroneous charges:</strong> if you were charged more than once for the same
                    enrollment, or charged an incorrect amount due to a processing error, we will correct the charge.
                  </li>
                  <li>
                    <strong>Access not granted due to a platform error:</strong> if your payment was approved but a
                    technical fault on our side prevented the course from being added to your account, we will
                    resolve the access issue or refund the affected payment.
                  </li>
                  <li>
                    <strong>Non-waivable statutory rights:</strong> where applicable consumer-protection law grants
                    you a right that cannot be waived by this policy, that right applies to the extent required by
                    law. In many jurisdictions, statutory withdrawal rights for digital content are understood not
                    to apply once delivery of that content has begun with the buyer's informed consent — which,
                    on Tutiba, occurs at the moment of purchase. This section describes general industry practice
                    and is not a substitute for legal advice specific to your jurisdiction.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. Reporting a Payment or Access Issue</h2>
                <p className="leading-relaxed">
                  If you believe you were charged in error or did not receive access to a course you purchased,
                  contact our support team at{' '}
                  <a href="mailto:support@tutiba.com" className="font-bold text-accent-600 hover:text-accent-700" dir="ltr">support@tutiba.com</a>{' '}
                  as soon as possible, or visit our{' '}
                  <Link to="/contact" className="font-bold text-accent-600 hover:text-accent-700">Contact page</Link>. Please include your order
                  details so we can investigate quickly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">6. Changes to This Policy</h2>
                <p className="leading-relaxed">
                  We may update this policy from time to time to reflect changes to our courses or applicable law.
                  The "Last updated" date above reflects the most recent revision. Continued use of Tutiba after an
                  update constitutes acceptance of the revised policy.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-primary-200">
              <Link to="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-accent-600 transition-colors font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                Home
              </Link>
            </div>
          </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}

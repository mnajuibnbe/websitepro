import React, { useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

export function Terms() {
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
                <FileText className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">Terms of Service</h1>
                <p className="text-primary-600">Last updated: July 23, 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By accessing Tutiba or enrolling in a course, you agree to these terms. Please review them before using the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. Course Access</h2>
                <p className="leading-relaxed">
                  Enrollment provides a personal, limited right to access the purchased course materials. Course files and resources may not be redistributed, resold, or published without permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. Account Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>Provide accurate account information and keep it current.</li>
                  <li>Protect your sign-in credentials and do not share your account.</li>
                  <li>Use the platform lawfully and respect intellectual property rights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. Certificates</h2>
                <p className="leading-relaxed">
                  Certificates are issued only after the applicable completion requirements have been met. They confirm course completion and do not replace a regulated professional license.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. Cancellations and Refunds</h2>
                <p className="leading-relaxed">
                  Refund requests are reviewed according to the policy presented during checkout and any applicable consumer-protection requirements. Contact support promptly if you experience an enrollment or payment issue.
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

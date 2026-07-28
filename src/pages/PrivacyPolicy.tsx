import React, { useEffect } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">Privacy Policy</h1>
                <p className="text-primary-600">Last updated: July 23, 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. Introduction</h2>
                <p className="leading-relaxed">
                  Tutiba respects your privacy. This policy explains which personal data we collect, how we use it, and the choices available to you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. Data We Collect</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li><strong>Account data:</strong> Your name, email address, and profile preferences.</li>
                  <li><strong>Payment data:</strong> Transaction details processed by our payment providers.</li>
                  <li><strong>Learning activity:</strong> Enrollments, lesson progress, quiz attempts, and certificates.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. How We Use Your Data</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>Provide courses, track progress, and issue certificates.</li>
                  <li>Manage your account and respond to support requests.</li>
                  <li>Maintain platform security and improve our services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. Data Security</h2>
                <p className="leading-relaxed">
                  We use administrative and technical safeguards, including SSL/TLS encryption, to protect personal data from unauthorized access or disclosure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. Your Choices</h2>
                <p className="leading-relaxed">
                  You may update your profile or request access to, correction of, or deletion of your personal data by contacting our support team.
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
                <ArrowRight className="w-5 h-5" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

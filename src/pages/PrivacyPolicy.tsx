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
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. Our Commitment to Privacy</h2>
                <p className="leading-relaxed">
                  Tutiba respects your privacy and handles personal information responsibly. This policy explains what we collect, why we collect it, and the choices available to you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. Information We Collect</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li><strong>Account information:</strong> Your name, email address, and profile details.</li>
                  <li><strong>Transaction information:</strong> Purchase and billing records needed to process enrollment.</li>
                  <li><strong>Learning activity:</strong> Course progress, quiz results, and certificate eligibility.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. How We Use Information</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>Provide courses, track progress, and issue certificates.</li>
                  <li>Manage your account and respond to support requests.</li>
                  <li>Maintain, secure, and improve the learning experience.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. Data Security</h2>
                <p className="leading-relaxed">
                  We use appropriate technical and organizational safeguards, including encrypted connections, to protect personal information from unauthorized access, loss, or misuse.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. Your Choices and Rights</h2>
                <p className="leading-relaxed">
                  You may request access to, correction of, or deletion of your personal information by contacting our support team. Some records may be retained where required for legal or operational purposes.
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

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
                <p className="text-primary-600">Update: 23 Privacy Information 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. Privacy Information</h2>
                <p className="leading-relaxed">
                  Privacy Information (Tutiba) Privacy Information. Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. Privacy Information</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li><strong>Account:</strong> Email Address.</li>
                  <li><strong>Payment:</strong> Privacy Information.</li>
                  <li><strong>Privacy Information:</strong> Review the quiz information and continue when you are ready.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. Privacy Information</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>Course progress, quiz results, and issued certificates.</li>
                  <li>Account details and profile information you provide.</li>
                  <li>Technical data used to maintain and improve the platform.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. Privacy Information</h2>
                <p className="leading-relaxed">
                  Privacy Information (SSL/TLS) Privacy Information. Privacy Information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. Privacy Information</h2>
                <p className="leading-relaxed">
                  You may request correction or deletion of eligible personal information.
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

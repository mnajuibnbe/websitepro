import React, { useEffect } from 'react';
import { Info, Award, Users, BookOpen } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

export function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main id="main-content" className="pt-32 pb-24">
        <PageContainer>
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-6">About Us</h1>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed">
              Tutiba provides focused, evidence-based education for professionals working in cosmetics and cosmeceuticals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-white rounded-3xl p-8 border border-primary-200 shadow-sm">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">Our Mission</h2>
              <p className="text-lg text-primary-600 leading-relaxed">
                We make high-quality cosmeceutical education clear, practical, and accessible so learners can make confident, responsible professional decisions.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-primary-200 shadow-sm">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">Our Approach</h2>
              <p className="text-lg text-primary-600 leading-relaxed">
                Our courses combine scientific foundations, real-world examples, and structured learning paths designed for lasting professional growth.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              { icon: BookOpen, title: "Expert Curriculum", desc: "Structured courses grounded in current scientific practice" },
              { icon: Users, title: "Learner Focused", desc: "Clear instruction designed around professional goals" },
              { icon: Award, title: "Verified Achievement", desc: "Certificates that recognize completed learning" },
              { icon: Info, title: "Practical Guidance", desc: "Knowledge you can apply confidently in your work" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-primary-200 text-center">
                <div className="w-16 h-16 mx-auto bg-accent-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="font-bold text-xl text-primary-900 mb-2">{feature.title}</h3>
                <p className="text-primary-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}

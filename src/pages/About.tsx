import React, { useEffect } from 'react';
import { ArrowRight, Info, Award, Users, BookOpen } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-primary-900 mb-6">About Us</h1>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed">
              Tutiba delivers accessible, expert-led education for professionals and lifelong learners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-white rounded-3xl p-8 border border-primary-200 shadow-sm">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">Our Mission</h2>
              <p className="text-lg text-primary-600 leading-relaxed">
                We make specialized knowledge easier to understand through structured courses, practical lessons, and meaningful assessments.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-primary-200 shadow-sm">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">Our Approach</h2>
              <p className="text-lg text-primary-600 leading-relaxed">
                Every learning experience is designed to be clear, flexible, and relevant to real professional goals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              { icon: BookOpen, title: "Structured Learning", desc: "Focused curricula that build knowledge step by step." },
              { icon: Users, title: "Expert Instruction", desc: "Courses created and taught by experienced professionals." },
              { icon: Award, title: "Recognized Progress", desc: "Assessments and certificates that document achievement." },
              { icon: Info, title: "Accessible Support", desc: "Clear guidance throughout every stage of learning." }
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

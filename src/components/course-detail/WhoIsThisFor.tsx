import React from 'react';
import { Stethoscope, Pill, GraduationCap, Sparkles } from 'lucide-react';

export function WhoIsThisFor() {
  const audiences = [
    {
      title: 'Intended Audience',
      description: 'Health and beauty professionals building evidence-based knowledge.',
      icon: Stethoscope
    },
    {
      title: 'Intended Audience',
      description: 'Pharmacists and clinicians who advise clients on skin care.',
      icon: Pill
    },
    {
      title: 'Intended Audience',
      description: 'Students seeking a structured introduction to cosmeceuticals.',
      icon: GraduationCap
    },
    {
      title: 'Beginner',
      description: 'Professionals who want practical, case-based learning.',
      icon: Sparkles
    }
  ];

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Course
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {audiences.map((audience, index) => {
          const Icon = audience.icon;
          return (
            <div key={index} className="bg-primary-50 border border-primary-100 p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-primary-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-1">{audience.title}</h3>
                <p className="text-sm text-primary-600 leading-relaxed">{audience.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

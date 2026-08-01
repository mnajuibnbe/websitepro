import React from 'react';
import { ShieldCheck, BookOpen, Clock, ListChecks } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';

export function StatsBar() {
  const stats = [
    { id: 1, value: 'Evidence-led', label: 'Course foundations', icon: ShieldCheck },
    { id: 2, value: 'Structured', label: 'Learning paths', icon: BookOpen },
    { id: 3, value: 'Flexible', label: 'Self-paced study', icon: Clock },
    { id: 4, value: 'Practical', label: 'Knowledge checks', icon: ListChecks },
  ];

  return (
    <section className="bg-white border-y border-primary-100">
      <PageContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 py-8 md:py-12 gap-y-8 md:gap-y-0 md:divide-x md:divide-x-reverse divide-primary-100">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className={`flex flex-col items-center text-center ${
                  index % 2 === 0 ? 'border-l border-primary-100 md:border-l-0' : ''
                }`}
              >
                <div className="w-12 h-12 bg-accent-50 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent-600" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-primary-900 mb-1">{stat.value}</span>
                <span className="text-sm font-medium text-primary-600">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

import React from 'react';
import { Users, BookOpen, Clock, ListChecks } from 'lucide-react';

export function StatsBar() {
  const stats = [
    { id: 1, value: '1000+', label: 'Learner Milestone', icon: Users },
    { id: 2, value: '8+', label: 'Learner Milestone', icon: BookOpen },
    { id: 3, value: '200+', label: 'Hour', icon: Clock },
    { id: 4, value: '50+', label: 'Learner Milestone', icon: ListChecks },
  ];

  return (
    <section className="bg-white border-y border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <span className="text-3xl md:text-4xl font-bold text-primary-900 mb-1">{stat.value}</span>
                <span className="text-sm font-medium text-primary-600">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

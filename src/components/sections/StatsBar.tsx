import React from 'react';
import { BookOpen, Clock3, Loader2, RefreshCw, UsersRound } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageStats } from '../../hooks/useHomepageMarketing';

export function StatsBar() {
  const { data, error, isLoading, refetch } = useHomepageStats();
  const stats = [
    { id: 'students', value: data.studentsValue, label: 'Students taught', icon: UsersRound },
    { id: 'courses', value: data.coursesValue, label: 'Courses delivered', icon: BookOpen },
    { id: 'hours', value: data.learningHoursValue, label: 'Hours of learning', icon: Clock3 },
  ];

  return (
    <section className="border-y border-primary-100 bg-white" aria-label="Tutiba platform statistics">
      <PageContainer>
        {isLoading && <div role="status" className="flex min-h-40 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading platform statistics</span></div>}
        {!isLoading && error && <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"><p className="font-bold text-primary-800">Platform metrics are temporarily unavailable.</p><button type="button" onClick={refetch} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-300 px-4 font-bold text-primary-800 hover:bg-primary-50"><RefreshCw className="h-4 w-4" /> Retry</button></div>}
        {!isLoading && !error && <div className="grid grid-cols-1 gap-y-0 py-6 sm:grid-cols-3 sm:divide-x sm:divide-primary-100 md:py-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className={`group flex items-center gap-5 px-4 py-6 text-left sm:flex-col sm:justify-center sm:gap-3 sm:px-6 sm:text-center ${index > 0 ? 'border-t border-primary-100 sm:border-t-0' : ''}`}
              >
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-accent-100 bg-accent-50 transition-colors group-hover:bg-accent-100">
                  <Icon className="h-5 w-5 text-accent-700" />
                </div>
                <div className="min-w-0 sm:min-w-32">
                  <span className="block whitespace-nowrap text-3xl font-bold leading-none tracking-tight text-primary-900 md:text-4xl">{stat.value}</span>
                  <span className="mt-2 block max-w-xs text-xs font-bold uppercase leading-relaxed tracking-wider text-primary-500 sm:text-sm sm:normal-case sm:tracking-normal">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>}
      </PageContainer>
    </section>
  );
}

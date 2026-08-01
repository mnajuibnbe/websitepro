import React from 'react';
import { BookOpen, Loader2, RefreshCw, Star, UsersRound } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageStats } from '../../hooks/useHomepageMarketing';

export function StatsBar() {
  const { data, error, isLoading, refetch } = useHomepageStats();
  const stats = [
    { id: 'courses', value: data.publishedCourseCount.toLocaleString(), label: 'Published courses', icon: BookOpen },
    { id: 'enrollments', value: data.activeEnrollmentCount.toLocaleString(), label: 'Active enrollments', icon: UsersRound },
    { id: 'rating', value: data.averageRating.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }), label: `Average rating · ${data.approvedReviewCount.toLocaleString()} approved reviews`, icon: Star },
  ];

  return (
    <section className="bg-white border-y border-primary-100">
      <PageContainer>
        {isLoading && <div role="status" className="flex min-h-40 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading platform statistics</span></div>}
        {!isLoading && error && <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"><p className="font-bold text-primary-800">Platform metrics are temporarily unavailable.</p><button type="button" onClick={refetch} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-300 px-4 font-bold text-primary-800 hover:bg-primary-50"><RefreshCw className="h-4 w-4" /> Retry</button></div>}
        {!isLoading && !error && <div className="grid grid-cols-1 sm:grid-cols-3 py-8 md:py-12 gap-y-8 sm:gap-y-0 sm:divide-x sm:divide-x-reverse divide-primary-100">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className={`flex flex-col items-center text-center ${index > 0 ? 'border-t border-primary-100 pt-8 sm:border-t-0 sm:pt-0' : ''}`}
              >
                <div className="w-12 h-12 bg-accent-50 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent-600" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-primary-900 mb-1">{stat.value}</span>
                <span className="text-sm font-medium text-primary-600">{stat.label}</span>
              </div>
            );
          })}
        </div>}
      </PageContainer>
    </section>
  );
}

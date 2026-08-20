import { Award, Clock3, Loader2, RefreshCw, UsersRound } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageStats, useHomepageInstructor } from '../../hooks/useHomepageMarketing';
import { CountUp } from '../ui/CountUp';
import { Reveal } from '../ui/Reveal';

export function StatsBar() {
  const { data, error, isLoading, refetch } = useHomepageStats();
  const { data: instructor } = useHomepageInstructor();
  const stats = [
    { id: 'students', value: data.studentsValue, label: 'Students taught', icon: UsersRound },
    { id: 'hours', value: data.learningHoursValue, label: 'Hours of learning', icon: Clock3 },
    { id: 'experience', value: instructor.experienceBadgeValue, label: instructor.experienceBadgeLabel, icon: Award },
  ];

  return (
    <section className="relative z-10 bg-accent-50/60" aria-label="Tutiba platform statistics">
      <PageContainer>
        <Reveal>
          {isLoading && <div role="status" className="flex min-h-24 items-center justify-center text-primary-500"><Loader2 className="h-6 w-6 animate-spin" /><span className="sr-only">Loading platform statistics</span></div>}
          {!isLoading && error && <div role="alert" className="flex min-h-24 flex-col items-center justify-center gap-3 text-center"><p className="font-bold text-primary-800">Platform metrics are temporarily unavailable.</p><button type="button" onClick={refetch} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-primary-300 px-4 font-bold text-primary-800 transition-colors duration-200 ease-out hover:border-primary-400 hover:bg-primary-50"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry</button></div>}
          {!isLoading && !error && <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-3 sm:gap-2 md:py-7">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className={`flex flex-col items-center justify-center gap-1.5 text-center ${index > 0 ? 'border-t border-accent-200/60 pt-4 sm:border-t-0 sm:pt-0' : ''}`}
                >
                  <Icon className="h-6 w-6 text-accent-700" aria-hidden="true" />
                  <CountUp value={stat.value} className="block whitespace-nowrap text-2xl font-bold leading-none tracking-tight text-primary-900 tabular-nums md:text-3xl" />
                  <span className="max-w-xs text-xs font-semibold uppercase leading-relaxed tracking-eyebrow text-primary-500">{stat.label}</span>
                </div>
              );
            })}
          </div>}
        </Reveal>
      </PageContainer>
    </section>
  );
}

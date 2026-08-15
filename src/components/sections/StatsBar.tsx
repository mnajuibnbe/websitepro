import { BookOpen, Clock3, Loader2, RefreshCw, UsersRound } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageStats } from '../../hooks/useHomepageMarketing';
import { CountUp } from '../ui/CountUp';
import { Reveal } from '../ui/Reveal';

export function StatsBar() {
  const { data, error, isLoading, refetch } = useHomepageStats();
  const stats = [
    { id: 'students', value: data.studentsValue, label: 'Students taught', icon: UsersRound },
    { id: 'courses', value: data.coursesValue, label: 'Courses delivered', icon: BookOpen },
    { id: 'hours', value: data.learningHoursValue, label: 'Hours of learning', icon: Clock3 },
  ];

  return (
    <section className="relative z-10 bg-primary-50 pb-section-sm md:pb-section" aria-label="Tutiba platform statistics">
      <PageContainer>
        <Reveal className="-mt-10 rounded-panel border border-primary-100 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] md:-mt-16">
          {isLoading && <div role="status" className="flex min-h-40 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading platform statistics</span></div>}
          {!isLoading && error && <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"><p className="font-bold text-primary-800">Platform metrics are temporarily unavailable.</p><button type="button" onClick={refetch} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-primary-300 px-4 font-bold text-primary-800 transition-colors duration-200 ease-out hover:border-primary-400 hover:bg-primary-50"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry</button></div>}
          {!isLoading && !error && <div className="grid grid-cols-1 gap-y-0 py-6 sm:grid-cols-3 sm:divide-x sm:divide-primary-100 md:py-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className={`flex flex-col items-center justify-center gap-4 px-4 py-6 text-center sm:px-6 ${index > 0 ? 'border-t border-primary-100 sm:border-t-0' : ''}`}
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-card border border-accent-100 bg-accent-50">
                    <Icon className="h-5 w-5 text-accent-700" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 sm:min-w-32">
                    <CountUp value={stat.value} className="block whitespace-nowrap font-display text-4xl font-semibold leading-none tracking-tight text-primary-900 tabular-nums md:text-5xl" />
                    <span className="mt-2 block max-w-xs text-xs font-bold uppercase leading-relaxed tracking-eyebrow text-primary-500">{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>}
        </Reveal>
      </PageContainer>
    </section>
  );
}

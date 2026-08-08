import { ArrowRight, BookOpenCheck, Laptop, Microscope, PlayCircle, RefreshCw, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

const features = [
  { title: 'Evidence-Based', description: 'Learn from current science and clear reasoning, not marketing claims.', icon: Microscope },
  { title: 'Expert Instructors', description: 'Study with trusted subject specialists who connect knowledge to practice.', icon: UsersRound },
  { title: 'Free Preview Lessons', description: 'Watch a complete lesson before you enroll, so you know exactly what you are paying for.', icon: PlayCircle },
  { title: 'Lifetime Updates', description: 'Return to your courses as lessons and supporting resources are updated.', icon: RefreshCw },
  { title: 'Learn Anywhere', description: 'Use a focused learning experience designed for desktop, tablet, and mobile.', icon: Laptop },
  { title: 'Practical Focus', description: 'Turn scientific foundations into better evaluation and real-world decisions.', icon: BookOpenCheck },
];

export function WhyChooseUs() {
  const navigate = useNavigate();
  const lastRowStart = features.length - (features.length % 2 === 0 ? 2 : 1);

  return (
    <section className="bg-white py-20 md:py-28">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="text-center lg:col-span-5 lg:text-left">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">The Tutiba Standard</p>
                <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-primary-900 md:text-5xl">
                  Why professionals <span className="italic text-accent-700">choose Tutiba.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-md leading-relaxed text-primary-600 lg:mx-0">
                  A professional education platform built around credible teaching, flexible access, and useful outcomes.
                </p>
                <Button variant="secondary" className="mt-8" onClick={() => navigate('/courses')}>
                  Compare all courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 border-t border-primary-100 sm:grid-cols-2">
              {features.map(({ title, description, icon: Icon }, index) => {
                const isLastRow = index >= lastRowStart;
                const isLeftCol = index % 2 === 0;
                return (
                  <Reveal
                    key={title}
                    delay={(index % 2) * 0.08}
                    className={`flex gap-4 py-7 ${isLastRow ? '' : 'border-b border-primary-100'} ${isLeftCol ? 'sm:border-r sm:border-primary-100 sm:pr-8' : 'sm:pl-8'}`}
                  >
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary-900">{title}</h3>
                      <p className="mt-1.5 leading-relaxed text-primary-600">{description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

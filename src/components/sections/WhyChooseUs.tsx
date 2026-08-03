import { Award, BookOpenCheck, Laptop, Microscope, RefreshCw, UsersRound } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';

const features = [
  { title: 'Evidence-Based', description: 'Learn from current science and clear reasoning, not marketing claims.', icon: Microscope },
  { title: 'Expert Instructors', description: 'Study with trusted subject specialists who connect knowledge to practice.', icon: UsersRound },
  { title: 'Certificates', description: 'Complete structured learning paths and earn certificates that mark your progress.', icon: Award },
  { title: 'Lifetime Updates', description: 'Return to your courses as lessons and supporting resources are updated.', icon: RefreshCw },
  { title: 'Learn Anywhere', description: 'Use a focused learning experience designed for desktop, tablet, and mobile.', icon: Laptop },
  { title: 'Practical Focus', description: 'Turn scientific foundations into better evaluation and real-world decisions.', icon: BookOpenCheck },
];

export function WhyChooseUs() {
  return <section className="bg-primary-50 py-16 md:py-24"><PageContainer><div className="mb-12 text-center md:mb-16"><h2 className="text-3xl font-bold text-primary-900 md:text-4xl">Why Professionals Choose Tutiba</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-primary-600">A professional education platform built around credible teaching, flexible access, and useful outcomes.</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">{features.map(({ title, description, icon: Icon }) => <article key={title} className="flex h-full flex-col rounded-xl border border-primary-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50"><Icon className="h-6 w-6 text-accent-600" /></div><h3 className="mb-3 text-xl font-bold text-primary-900">{title}</h3><p className="flex-grow leading-relaxed text-primary-600">{description}</p></article>)}</div></PageContainer></section>;
}

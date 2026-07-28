import type { ReactNode } from 'react';
import { BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TutibaBrand } from './TutibaBrand';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  eyebrow?: string;
}

export function AuthLayout({ title, description, children, eyebrow = 'Tutiba account' }: AuthLayoutProps) {
  return (
    <main className="min-h-screen min-h-dvh bg-primary-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.85fr)]" id="main-content">
      <section className="relative hidden overflow-hidden bg-primary-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16" aria-label="About Tutiba">
        <div aria-hidden="true" className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
        <TutibaBrand inverted className="relative z-10 self-start" />
        <div className="relative z-10 max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-4 py-2 text-sm font-semibold text-accent-200">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Evidence-based education
          </span>
          <h2 className="text-4xl font-bold leading-tight xl:text-5xl">Continue building practical confidence in cosmeceuticals.</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-300">Access your courses, learning progress, and professional education in one secure place.</p>
          <ul className="mt-10 grid gap-4 text-primary-200">
            <li className="flex items-center gap-3"><BookOpenCheck className="h-5 w-5 text-accent-400" aria-hidden="true" />Learn at your own pace</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-accent-400" aria-hidden="true" />Your account is protected by secure authentication</li>
          </ul>
        </div>
        <p className="relative z-10 text-sm text-primary-400">© {new Date().getFullYear()} Tutiba. All rights reserved.</p>
      </section>

      <section className="flex min-h-screen min-h-dvh items-center justify-center overflow-y-auto px-4 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <TutibaBrand className="mb-10 lg:hidden" />
          <div className="rounded-3xl border border-primary-200 bg-white p-6 shadow-sm sm:p-9">
            <header className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-accent-700">{eyebrow}</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-900">{title}</h1>
              <p className="mt-3 leading-relaxed text-primary-600">{description}</p>
            </header>
            {children}
          </div>
          <nav aria-label="Account help" className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-500">
            <Link to="/contact" className="rounded hover:text-accent-700">Contact support</Link>
            <Link to="/privacy" className="rounded hover:text-accent-700">Privacy</Link>
            <Link to="/terms" className="rounded hover:text-accent-700">Terms</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}

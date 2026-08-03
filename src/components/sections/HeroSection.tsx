import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, CheckCircle2, Play, X } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { SecureStreamProvider } from '../video/SecureStreamProvider';

export function HeroSection() {
  const navigate = useNavigate();
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  return <section className="relative overflow-hidden bg-primary-50 pb-16 pt-32 md:pb-24 md:pt-40"><PageContainer>
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
      <div className="flex flex-col items-start text-left lg:col-span-6">
        <span className="mb-6 inline-block rounded-full bg-accent-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-accent-800">Professional Medical Education</span>
        <h1 className="mb-6 font-sans text-4xl font-bold text-primary-900 md:text-display">Professional Medical Education, <br className="hidden md:block" />Powered by Experts</h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-primary-600 md:text-xl lg:mb-12">Evidence-based courses taught by trusted experts, built for professionals who want practical knowledge they can use with confidence.</p>
        <div className="mb-12 w-full sm:w-auto lg:mb-14"><Button variant="primary" className="h-14 w-full text-lg sm:w-auto lg:h-16 lg:px-8 lg:text-xl" onClick={() => navigate('/courses')}>Explore Courses <ArrowRight className="h-5 w-5" aria-hidden="true" /></Button></div>
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-primary-700"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent-600" /><span>Evidence-based content</span></div><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent-600" /><span>Expert-led courses</span></div><div className="flex items-center gap-2"><Award className="h-5 w-5 text-accent-600" /><span>Verified certificates</span></div></div>
      </div>
      <div className="relative lg:col-span-6"><div className="relative min-h-[460px] overflow-hidden rounded-3xl border border-primary-700 bg-primary-900 shadow-xl sm:aspect-[4/3] sm:min-h-0 lg:aspect-square">{isPlayingIntro ? <><SecureStreamProvider asset="homepage-intro" title="Welcome to Tutiba" publicPreview autoPlay fill /><button type="button" onClick={() => setIsPlayingIntro(false)} aria-label="Back to welcome video cover" className="absolute right-4 top-4 z-20 flex h-11 items-center gap-2 rounded-full bg-primary-950/80 px-4 text-sm font-bold text-white shadow-lg backdrop-blur transition hover:bg-primary-950 focus:outline-none focus:ring-4 focus:ring-accent-300/60"><X className="h-4 w-4" /> Back</button></> : <><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" /><div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-300/10 blur-3xl" /><div className="relative flex h-full min-h-[460px] flex-col items-center justify-center px-6 py-8 text-center text-white sm:min-h-0 sm:px-8 sm:py-0"><span className="mb-5 rounded-full border border-accent-300/30 bg-accent-500/10 px-4 py-2 text-xs font-bold uppercase tracking-eyebrow text-accent-200">Welcome to Tutiba</span><h2 className="max-w-md text-2xl font-bold leading-tight text-white md:text-3xl">Meet your professional learning platform.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-primary-300 md:text-base">Discover how expert teaching, scientific depth, and practical application come together at Tutiba.</p><button type="button" aria-label="Play the Tutiba welcome video" onClick={() => setIsPlayingIntro(true)} className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-white text-accent-700 shadow-2xl transition-all hover:scale-105 hover:bg-accent-50 focus:outline-none focus:ring-4 focus:ring-accent-300/50"><Play className="h-8 w-8 fill-current ms-1" /></button><span className="mt-4 text-sm font-bold text-accent-100">Play welcome video</span></div></>}</div></div>
    </div>
  </PageContainer></section>;
}

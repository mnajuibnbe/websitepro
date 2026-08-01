import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { CheckCircle2, BookOpen, Award, Play } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PageContainer } from '../layout/PageContainer';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-primary-50">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100 text-accent-800 text-sm font-bold mb-6 uppercase tracking-wider">
              Professional Cosmeceutical Education
            </span>

            <h1 className="mb-6 font-sans text-4xl font-bold text-primary-900 md:text-display">
              Master Cosmeceuticals <br className="hidden md:block" />
              with Scientific Confidence
            </h1>

            <p className="text-lg md:text-xl text-primary-600 mb-10 leading-relaxed max-w-xl">
              Build evidence-based knowledge through flexible courses designed for health and beauty professionals.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-12">
              <Button variant="primary" className="w-full sm:w-auto text-lg h-14" onClick={() => navigate('/courses')}>
                Explore Courses
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto text-lg h-14 bg-white" icon={<Play className="w-4 h-4 fill-current" />} onClick={() => navigate('/about')}>
                See How Tutiba Works
              </Button>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-primary-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-600" />
                <span>Evidence-based content</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-600" />
                <span>Expert-led courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span>Verified certificates</span>
              </div>
            </div>
          </div>

          {/* Visual Content */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] lg:aspect-square bg-primary-200 rounded-2xl overflow-hidden shadow-lg border border-primary-200 flex items-center justify-center">
               <OptimizedImage
                 src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1000&auto=format&fit=crop"
                 alt="Professional reviewing cosmeceutical products in a clinical setting"
                 width="1000"
                 height="1000"
                 displayWidth={1000}
                 priority
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-primary-900/10 flex items-center justify-center">
                  <button type="button" aria-label="Learn how Tutiba courses work" onClick={() => navigate('/about')} className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-accent-600 hover:scale-105 hover:bg-white transition-all shadow-xl">
                    <Play className="w-8 h-8 fill-current ms-1" />
                  </button>
               </div>
            </div>
          </div>

        </div>
      </PageContainer>
    </section>
  );
}

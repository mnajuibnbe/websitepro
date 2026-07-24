import React from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, BookOpen, Award, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-right">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100 text-accent-800 text-sm font-bold mb-6 uppercase tracking-wider">
              Professional Cosmeceutical Education
            </span>
            
            <h1 className="text-4xl md:text-[48px] leading-[1.2] font-bold text-primary-900 mb-6 font-sans">
              Master Cosmeceuticals <br className="hidden md:block" />
              with Scientific Confidence
            </h1>
            
            <p className="text-lg md:text-xl text-primary-600 mb-10 leading-relaxed max-w-xl">
              تعلّمي كيف تفهمين المكونات، وتقيمين المنتجات، وتبنين قرارات قائمة على العلم.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-12">
              <Button variant="primary" className="w-full sm:w-auto text-lg h-14" onClick={() => window.location.hash = '#/courses'}>
                استكشفي الكورسات
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto text-lg h-14 bg-white" icon={<Play className="w-4 h-4 fill-current" />} onClick={() => window.location.hash = '#/lesson'}>
                شاهدي درسًا مجانيًا
              </Button>
            </div>
            
            {/* Trust Points */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-primary-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-600" />
                <span>محتوى علمي</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-600" />
                <span>تعلم عملي</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span>شهادة إتمام</span>
              </div>
            </div>
          </div>
          
          {/* Visual Content */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] lg:aspect-square bg-primary-200 rounded-2xl overflow-hidden shadow-lg border border-primary-200 flex items-center justify-center">
               <img 
                 src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1000&auto=format&fit=crop" 
                 alt="Cosmeceutical Education"
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-primary-900/10 flex items-center justify-center">
                  <button className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-accent-600 hover:scale-105 hover:bg-white transition-all shadow-xl">
                    <Play className="w-8 h-8 fill-current ms-1" />
                  </button>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

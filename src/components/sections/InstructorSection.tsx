import React from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PageContainer } from '../layout/PageContainer';

export function InstructorSection() {
  return (
    <section className="py-16 md:py-24 bg-primary-50 border-t border-primary-100">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Instructor brand (5 cols on Desktop) */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="aspect-square overflow-hidden rounded-[2rem] border border-primary-200 bg-gradient-to-br from-white via-[#fff8eb] to-accent-50 p-5 shadow-lg sm:p-8">
              <OptimizedImage displayWidth={800} width="1600" height="1600"
                src="/images/tutiba-instructor-logo.png"
                alt="Dr. Aya Elbrashy — Skin, Hair and Beauty Nutrition"
                className="h-full w-full rounded-full object-contain drop-shadow-sm"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-md border border-primary-100 hidden md:block">
              <div className="flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-3xl font-bold text-accent-600">10+</span>
                <span className="text-sm text-primary-600 font-semibold uppercase tracking-wider">Years of Experience</span>
              </div>
            </div>
          </div>

          {/* Instructor Content (7 cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left order-1 lg:order-2">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100 text-accent-800 text-sm font-bold mb-6 uppercase tracking-wider">
              Your Instructor
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
              Learn with Dr. Aya Elbrashy
            </h2>
            <p className="text-lg text-primary-600 mb-8 leading-relaxed max-w-2xl">
              Build your skin, hair, and beauty-nutrition knowledge with an educator who has spent more than a decade translating scientific concepts into practical professional decisions.
            </p>

            <ul className="space-y-4 mb-10 text-primary-800 font-medium">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">Skin structure linked directly to cosmeceutical action</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">Ingredient and product comparisons you can apply</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">Structured diploma stages with visible progress</span>
              </li>
            </ul>

            <Button variant="secondary" className="px-8 text-lg h-12">
              Meet Your Instructor
            </Button>
          </div>

        </div>
      </PageContainer>
    </section>
  );
}

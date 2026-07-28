import React from 'react';
import { Button } from '../ui/Button';

export function FinalCTA() {
  return (
    <section className="py-20 md:py-32 bg-primary-900 text-white text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
          Ready to Advance Your Cosmeceutical Career?
        </h2>
        <p className="text-lg md:text-xl text-primary-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          Choose an expert-led course and start building practical, evidence-based skills today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="primary" className="text-lg h-14 px-8 bg-accent-500 hover:bg-accent-400 text-primary-900 border-none hover:shadow-lg transition-all duration-300">
            Explore Courses
          </Button>
          <Button variant="secondary" className="text-lg h-14 px-8 border-primary-600 text-white hover:bg-primary-800 hover:border-primary-500 transition-all duration-300">
            Watch a Free Lesson
          </Button>
        </div>
      </div>
    </section>
  );
}

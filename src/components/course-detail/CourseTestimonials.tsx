import React from 'react';
import type { CourseTestimonial } from '../../services/courseTestimonials.service';

export function CourseTestimonials({ testimonials }: { testimonials: CourseTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mb-12 md:mb-16" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">What learners say</h2>
      <p className="mb-6 text-primary-600">Real feedback from learners across Dr. Aya's courses.</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map(testimonial => (
          <article key={testimonial.id} className="flex h-full flex-col rounded-panel border border-primary-200 bg-white p-6 shadow-sm">
            <p className="mb-5 line-clamp-4 flex-grow text-sm leading-relaxed text-primary-800" dir="auto">“{testimonial.quote}”</p>
            <div className="mt-auto flex items-center gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-200 text-sm font-bold text-primary-700">{testimonial.reviewerName.charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-primary-900">{testimonial.reviewerName}</div>
                <div className="truncate text-xs font-medium text-primary-500">{testimonial.sourceLabel}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

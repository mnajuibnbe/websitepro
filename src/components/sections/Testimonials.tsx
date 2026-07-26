import React from 'react';
import { Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      id: 1,
      quote: "Content. Build practical skills with structured, expert-led course content..",
      name: "Learn More. Learn More",
      profession: "Learn More",
      rating: 5
    },
    {
      id: 2,
      quote: "Lesson.",
      name: "Learn More. Learn More",
      profession: "Learn More",
      rating: 5
    },
    {
      id: 3,
      quote: "Learn More. Learn More.",
      name: "Learn More. Learn More",
      profession: "Learn More",
      rating: 5
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Students
          </h2>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            Learn More Tutiba.
          </p>
        </div>

        {/* Mobile Horizontal Scroll / Desktop Grid */}
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-6 lg:gap-8 snap-x snap-mandatory hide-scrollbar">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-none w-[85%] sm:w-[70%] md:w-auto snap-center bg-primary-50 p-8 lg:p-10 rounded-2xl border border-primary-100 flex flex-col h-full"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning-500 text-warning-500" />
                ))}
              </div>
              <p className="text-lg text-primary-800 flex-grow mb-8 leading-relaxed font-medium">
                "{testimonial.quote}"
              </p>
              <div className="mt-auto flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-primary-900">{testimonial.name}</div>
                  <div className="text-sm text-primary-600 font-medium">{testimonial.profession}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

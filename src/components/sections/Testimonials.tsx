import React from 'react';
import { Loader2, MessageSquareText, RefreshCw, Star } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { useHomepageTestimonials } from '../../hooks/useHomepageMarketing';

export function Testimonials() {
  const { data: testimonials, error, isLoading, refetch } = useHomepageTestimonials();
  const isLegacyCollection = testimonials.length > 0 && testimonials.every(testimonial => testimonial.source === 'legacy_import');

  return (
    <section className="py-16 md:py-24 bg-white">
      <PageContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            Real experiences from health professionals who developed their skills with Tutiba.
          </p>
        </div>

        {isLoading && (
          <div role="status" className="flex min-h-56 items-center justify-center text-primary-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="sr-only">Loading student reviews</span>
          </div>
        )}

        {!isLoading && error && (
          <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-primary-200 bg-primary-50 p-8 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-primary-300" />
            <h3 className="mt-4 text-xl font-bold text-primary-900">Reviews are temporarily unavailable</h3>
            <p className="mt-2 text-primary-600">Please try again in a moment.</p>
            <button type="button" onClick={refetch} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-300 px-4 font-bold text-primary-800 hover:bg-white">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {!isLoading && !error && testimonials.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-8 text-center md:p-10">
            <MessageSquareText className="mx-auto h-10 w-10 text-accent-500" />
            <h3 className="mt-4 text-xl font-bold text-primary-900">Student reviews are coming soon</h3>
            <p className="mt-2 text-primary-600">Approved learner experiences will appear here as our community shares them.</p>
          </div>
        )}

        {!isLoading && !error && testimonials.length > 0 && <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-6 lg:gap-8 snap-x snap-mandatory hide-scrollbar">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.review_id}
              className="flex-none w-[85%] sm:w-[70%] md:w-auto snap-center bg-primary-50 p-8 lg:p-10 rounded-2xl border border-primary-100 flex flex-col h-full"
            >
              {testimonial.source === 'platform' && testimonial.rating !== null ? (
                <div className="flex items-center gap-1 mb-6" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-5 h-5 ${star <= testimonial.rating! ? 'fill-warning-500 text-warning-500' : 'text-primary-200'}`} />
                  ))}
                </div>
              ) : null}
              <p dir="auto" className="text-lg text-primary-800 flex-grow mb-8 leading-relaxed font-medium">
                “{testimonial.comment}”
              </p>
              <div className="mt-auto flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {testimonial.reviewer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-primary-900">{testimonial.reviewer_name}</div>
                  {testimonial.source === 'platform' && <div className="text-sm text-primary-600 font-medium">Verified learner review</div>}
                </div>
              </div>
            </div>
          ))}
        </div>}

        {!isLoading && !error && isLegacyCollection && (
          <p className="mx-auto mt-2 max-w-3xl text-center text-sm leading-relaxed text-primary-500">
            These genuine testimonials were collected before Tutiba’s current review-submission and moderation system. New approved platform reviews will take their place here automatically.
          </p>
        )}
      </PageContainer>
    </section>
  );
}

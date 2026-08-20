import React from 'react';
import { Star } from 'lucide-react';

export interface PublicCourseReview {
  review_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export function CourseReviews({ reviews }: { reviews: PublicCourseReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Student reviews
      </h2>

      <div className="bg-white border border-primary-200 rounded-panel p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <article key={review.review_id} className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-primary-900">{review.reviewer_name}</h3>
                </div>
                <time dateTime={review.created_at} className="text-xs text-primary-400 font-medium">{new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(review.created_at))}</time>
              </div>
              <div className="flex items-center text-warning-500 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-primary-300'}`} />
                ))}
              </div>
              <p className="text-primary-700 text-sm leading-relaxed font-medium" dir="auto">
                “{review.comment}”
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

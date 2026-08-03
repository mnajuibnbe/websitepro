import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { CheckCircle2, Clock, BookOpen, Star } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

export interface CourseCardProps {
  key?: React.Key;
  title: string;
  category: string;
  description: string;
  duration: string;
  lessonsCount: number;
  rating: number;
  reviewCount: number;
  price: string;
  imageUrl: string;
  curriculumHighlights?: string[];
  ctaText?: string;
  onEnroll?: () => void;
  fullWidthCta?: boolean;
}

export function CourseCard({
  title,
  category,
  description,
  duration,
  lessonsCount,
  rating,
  reviewCount,
  price,
  imageUrl,
  curriculumHighlights = [],
  ctaText = 'View Course',
  onEnroll,
  fullWidthCta = false,
}: CourseCardProps) {
  const lessonsLabel = `${lessonsCount} ${lessonsCount === 1 ? 'lesson' : 'lessons'}`;
  return (
    <article className="flex flex-col bg-white border border-primary-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Thumbnail (16:9) */}
      <div className="relative aspect-video bg-primary-100">
        <OptimizedImage
          src={imageUrl}
          alt={title}
          displayWidth={600}
          width="600"
          height="338"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge variant="accent">{category}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6">
        <h3 className="text-xl font-bold text-primary-900 mb-2">{title}</h3>
        <p className="text-sm text-primary-600 mb-4 line-clamp-2">{description}</p>

        {curriculumHighlights.length > 0 && (
          <ul className="mb-5 space-y-2 text-sm leading-snug text-primary-700" aria-label="Curriculum highlights">
            {curriculumHighlights.slice(0, 2).map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-accent-600" aria-hidden="true" />
                <span className="line-clamp-2">{highlight.replace(/^(Lecture|Section)\s*\d*\s*:\s*/i, '')}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Metadata */}
        <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-primary-500 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-300"></div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsLabel}</span>
          </div>
          {reviewCount > 0 && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-primary-300"></div>
              <span className="inline-flex items-center gap-1" aria-label={`${rating} out of 5 from ${reviewCount} reviews`}>
                <Star className="w-4 h-4 fill-current text-warning-500" /> {rating.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {/* Footer (Price & CTA) */}
        <div className={`mt-auto border-t border-primary-100 pt-4 ${fullWidthCta ? 'flex flex-col gap-3' : 'flex items-center justify-between'}`}>
          <div className="text-xl font-bold text-primary-900">
            {price}
          </div>
          <Button variant="primary" onClick={onEnroll} className={fullWidthCta ? 'w-full' : ''}>
            {ctaText}
          </Button>
        </div>
      </div>
    </article>
  );
}

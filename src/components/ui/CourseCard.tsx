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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-900/10">
      {/* Thumbnail (16:9) */}
      <div className="relative aspect-video overflow-hidden bg-primary-100">
        <OptimizedImage
          src={imageUrl}
          alt={title}
          displayWidth={600}
          width="600"
          height="338"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Badge variant="accent" className="shadow-sm">{category}</Badge>
          {reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-primary-900 shadow-sm backdrop-blur" aria-label={`${rating} out of 5 from ${reviewCount} reviews`}>
              <Star className="h-3.5 w-3.5 fill-current text-warning-500" /> {rating.toFixed(1)}
              <span className="font-medium text-primary-500">({reviewCount})</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-6 lg:p-7">
        <h3 className="mb-2 text-xl font-bold text-primary-900">{title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-primary-600">{description}</p>

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
        <div className="mb-6 mt-auto flex flex-wrap items-center gap-3 text-sm text-primary-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-300"></div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsLabel}</span>
          </div>
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

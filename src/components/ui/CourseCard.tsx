import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  key?: React.Key;
  title: string;
  category: string;
  description: string;
  duration: string;
  lessonsCount: number;
  price: number | string;
  imageUrl?: string;
  ctaText?: string;
  onEnroll?: () => void;
}

export function CourseCard({
  title,
  category,
  description,
  duration,
  lessonsCount,
  price,
  imageUrl = 'https://placehold.co/600x338/E2E8F0/64748B?text=Course',
  ctaText = 'Learn More',
  onEnroll
}: CourseCardProps) {
  return (
    <div className="flex flex-col bg-white border border-primary-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Thumbnail (16:9) */}
      <div className="relative aspect-video bg-primary-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge variant="accent">{category}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6">
        <h3 className="text-xl font-bold text-primary-900 mb-2">{title}</h3>
        <p className="text-sm text-primary-600 mb-4 line-clamp-2 flex-grow">{description}</p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-primary-500 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-300"></div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsCount} Lesson</span>
          </div>
        </div>

        {/* Footer (Price & CTA) */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary-100">
          <div className="text-xl font-bold text-primary-900">
            {typeof price === 'number' ? `$${price}` : price}
          </div>
          <Button variant="primary" onClick={onEnroll}>
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  );
}

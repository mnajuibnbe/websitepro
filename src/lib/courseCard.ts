import type { CourseCardProps } from '../components/ui/CourseCard';
import type { PricingContext } from './pricing';
import { resolveCoursePrice } from './pricing';
import type { CourseCatalogItem } from '../services/courseCatalog.service';

export const COURSE_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop';

export function resolveCourseImageUrl(course: Pick<CourseCatalogItem, 'thumbnail' | 'cover_image'>): string {
  return course.thumbnail || course.cover_image || COURSE_IMAGE_FALLBACK;
}

export function mapCourseToCardProps(
  course: CourseCatalogItem,
  pricingContext: PricingContext,
  overrides: Pick<CourseCardProps, 'ctaText' | 'onEnroll'> = {},
): CourseCardProps {
  return {
    title: course.title,
    category: course.category || course.level || 'Professional course',
    description: course.short_description || course.description || '',
    duration: course.duration || 'Self-paced',
    lessonsCount: course.lessonsCount,
    rating: course.rating,
    reviewCount: course.reviewCount,
    price: resolveCoursePrice(course, pricingContext).formatted,
    imageUrl: resolveCourseImageUrl(course),
    ctaText: overrides.ctaText,
    onEnroll: overrides.onEnroll,
  };
}

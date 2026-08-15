import type { CourseCardProps } from '../components/ui/CourseCard';
import type { PricingContext } from './pricing';
import { resolveCoursePrice } from './pricing';
import type { CourseCatalogItem } from '../services/courseCatalog.service';
import { formatCourseTotalHours } from './courseDuration';

export const COURSE_IMAGE_FALLBACK = '/course-placeholder.svg';

export function resolveCourseImageUrl(course: Pick<CourseCatalogItem, 'thumbnail' | 'cover_image'>): string {
  return course.thumbnail || course.cover_image || COURSE_IMAGE_FALLBACK;
}

export function mapCourseToCardProps(
  course: CourseCatalogItem,
  pricingContext: PricingContext,
  overrides: Pick<CourseCardProps, 'ctaText' | 'onEnroll' | 'fullWidthCta'> = {},
): CourseCardProps {
  return {
    title: course.title,
    category: course.category || course.level || 'Professional course',
    description: course.short_description || course.description || '',
    duration: formatCourseTotalHours(Number(course.total_video_duration_seconds || 0)),
    lessonsCount: course.lessonsCount,
    rating: course.rating,
    reviewCount: course.reviewCount,
    price: resolveCoursePrice(course, pricingContext).formatted,
    imageUrl: resolveCourseImageUrl(course),
    curriculumHighlights: course.curriculumHighlights,
    isFeatured: Boolean(course.is_featured),
    isBestseller: Boolean(course.is_bestseller),
    ctaText: overrides.ctaText,
    onEnroll: overrides.onEnroll,
    fullWidthCta: overrides.fullWidthCta,
  };
}

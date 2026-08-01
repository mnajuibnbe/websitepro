import type { Course } from '../types/database.types';
import { DEFAULT_PRICING_CONTEXT, resolveCoursePrice, type PricingContext } from './pricing';

export type CourseSort = 'newest' | 'price-asc' | 'price-desc';
export type PriceFilter = 'all' | 'free' | 'paid';
export type DurationFilter = 'short' | 'medium' | 'long';

export interface CourseCatalogFilters {
  search: string;
  sort: CourseSort;
  categories: string[];
  levels: string[];
  price: PriceFilter;
  durations: DurationFilter[];
}

export const EMPTY_CATALOG_FILTERS: CourseCatalogFilters = {
  search: '',
  sort: 'newest',
  categories: [],
  levels: [],
  price: 'all',
  durations: [],
};

const numericPrice = (course: Course, context: PricingContext) => {
  const amount = resolveCoursePrice(course, context).amount;
  return amount === null ? Number.POSITIVE_INFINITY : Number(amount);
};
const durationHours = (course: Course) => {
  const parsed = Number.parseFloat(course.duration || '');
  return Number.isFinite(parsed) ? parsed : null;
};

function categoryMatches(courseCategory: string | null, selectedCategory: string): boolean {
  return Boolean(courseCategory && courseCategory.localeCompare(selectedCategory, undefined, { sensitivity: 'accent' }) === 0);
}

export function filterAndSortCourses(courses: Course[], filters: CourseCatalogFilters, context: PricingContext = DEFAULT_PRICING_CONTEXT): Course[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return courses
    .filter((course) => {
      const searchable = [course.title, course.short_description, course.description, course.category]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      if (search && !searchable.includes(search)) return false;
      if (filters.categories.length && !filters.categories.some(category => categoryMatches(course.category, category))) return false;
      if (filters.levels.length && !filters.levels.includes(course.level || '')) return false;

      const price = numericPrice(course, context);
      if (filters.price === 'free' && price !== 0) return false;
      if (filters.price === 'paid' && price <= 0) return false;

      if (filters.durations.length) {
        const hours = durationHours(course);
        const durationMatches = hours !== null && filters.durations.some((duration) =>
          duration === 'short' ? hours < 5 : duration === 'medium' ? hours >= 5 && hours <= 20 : hours > 20
        );
        if (!durationMatches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'price-asc') return numericPrice(a, context) - numericPrice(b, context);
      if (filters.sort === 'price-desc') return numericPrice(b, context) - numericPrice(a, context);
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    });
}

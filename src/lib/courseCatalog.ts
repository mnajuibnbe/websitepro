import type { Course } from '../types/database.types';

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

const numericPrice = (course: Course) => Number(course.price || 0);
const durationHours = (course: Course) => {
  const parsed = Number.parseFloat(course.duration || '');
  return Number.isFinite(parsed) ? parsed : null;
};

function categoryMatches(courseCategory: string | null, selectedCategory: string): boolean {
  if (!courseCategory) return false;
  if (courseCategory === selectedCategory) return true;
  if (selectedCategory === 'العناية بالبشرة') return courseCategory.includes('بشرة');
  if (selectedCategory === 'العناية بالشعر') return courseCategory.includes('شعر');
  if (selectedCategory === 'برامج الدبلومة') return courseCategory.includes('دبلوم');
  if (selectedCategory === 'كورسات متخصصة') return courseCategory.includes('متخصص');
  return false;
}

export function filterAndSortCourses(courses: Course[], filters: CourseCatalogFilters): Course[] {
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

      const price = numericPrice(course);
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
      if (filters.sort === 'price-asc') return numericPrice(a) - numericPrice(b);
      if (filters.sort === 'price-desc') return numericPrice(b) - numericPrice(a);
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    });
}

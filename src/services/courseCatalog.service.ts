import type { PricingContext } from '../lib/pricing';
import { DEFAULT_PRICING_CONTEXT } from '../lib/pricing';
import { supabase } from '../lib/supabase';
import type { Course, PublicCourseWithStats } from '../types/database.types';
import type { CourseCatalogFilters, CourseSort, DurationFilter } from '../lib/courseCatalog';

export type CourseCatalogSort = CourseSort | 'featured';

export interface CourseCatalogItem extends Course {
  lessonsCount: number;
  rating: number;
  reviewCount: number;
  enrolledStudentCount: number;
}

export interface CourseCatalogQuery {
  enabled?: boolean;
  filters?: Partial<CourseCatalogFilters>;
  id?: string;
  page?: number;
  pageSize?: number;
  pricingContext?: PricingContext;
  sort?: CourseCatalogSort;
}

export interface CourseCatalogResult {
  courses: CourseCatalogItem[];
  totalCount: number;
}

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 50;

const legacyCategoryTerms: Record<string, string> = {
  'Skin Care': '\u0628\u0634\u0631\u0629',
  'Hair Care': '\u0634\u0639\u0631',
  'Diploma Programs': '\u062f\u0628\u0644\u0648\u0645',
  'Specialized Courses': '\u0645\u062a\u062e\u0635\u0635',
};

function quotedFilterValue(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function normalizePositiveInteger(value: number | undefined, fallback: number, maximum?: number): number {
  const normalized = Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback;
  return maximum ? Math.min(normalized, maximum) : normalized;
}

function durationConditions(filters: DurationFilter[]): string[] {
  return filters.flatMap((duration) => {
    if (duration === 'short') return ['course->total_video_duration_seconds.lt.18000'];
    if (duration === 'medium') return ['and(course->total_video_duration_seconds.gte.18000,course->total_video_duration_seconds.lte.72000)'];
    return ['course->total_video_duration_seconds.gt.72000'];
  });
}

export function normalizeCourseCatalogQuery(options: CourseCatalogQuery = {}) {
  const page = normalizePositiveInteger(options.page, 1);
  const pageSize = normalizePositiveInteger(options.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const filters = options.filters || {};
  const pricingContext = options.pricingContext || DEFAULT_PRICING_CONTEXT;

  return {
    id: options.id || null,
    page,
    pageSize,
    pricingCurrency: pricingContext.currency,
    search: filters.search?.trim() || '',
    categories: [...(filters.categories || [])].sort(),
    levels: [...(filters.levels || [])].sort(),
    price: filters.price || 'all',
    durations: [...(filters.durations || [])].sort(),
    sort: options.sort || filters.sort || 'newest',
  } as const;
}

export function courseCatalogCacheKey(options: CourseCatalogQuery = {}): string {
  return JSON.stringify(normalizeCourseCatalogQuery(options));
}

export function shapePublicCourse(row: PublicCourseWithStats): CourseCatalogItem {
  return {
    ...row.course,
    lessonsCount: Number(row.lessons_count || 0),
    rating: Number(row.average_rating || 0),
    reviewCount: Number(row.review_count || 0),
    enrolledStudentCount: Number(row.enrolled_student_count || 0),
  };
}

export async function fetchCourseCatalog(options: CourseCatalogQuery = {}): Promise<CourseCatalogResult> {
  const queryOptions = normalizeCourseCatalogQuery(options);
  const offset = (queryOptions.page - 1) * queryOptions.pageSize;
  const priceColumn = queryOptions.pricingCurrency === 'EGP' ? 'price_egp' : 'price_usd';

  let query = supabase.rpc('get_public_courses_with_stats', {}, { count: 'exact' });

  if (queryOptions.id) query = query.eq('course->>id', queryOptions.id);

  if (queryOptions.search) {
    const pattern = quotedFilterValue(`%${queryOptions.search}%`);
    query = query.or([
      `course->>title.ilike.${pattern}`,
      `course->>short_description.ilike.${pattern}`,
      `course->>description.ilike.${pattern}`,
      `course->>category.ilike.${pattern}`,
    ].join(','));
  }

  if (queryOptions.categories.length) {
    const conditions = queryOptions.categories.flatMap((category) => {
      const exact = `course->>category.eq.${quotedFilterValue(category)}`;
      const legacyTerm = legacyCategoryTerms[category];
      return legacyTerm
        ? [exact, `course->>category.ilike.${quotedFilterValue(`%${legacyTerm}%`)}`]
        : [exact];
    });
    query = query.or(conditions.join(','));
  }

  if (queryOptions.levels.length) query = query.in('course->>level', queryOptions.levels);
  if (queryOptions.price === 'free') query = query.eq(`course->${priceColumn}`, 0);
  if (queryOptions.price === 'paid') query = query.gt(`course->${priceColumn}`, 0);
  if (queryOptions.durations.length) query = query.or(durationConditions(queryOptions.durations).join(','));

  if (queryOptions.sort === 'featured') {
    query = query
      .order('course->home_order', { ascending: true, nullsFirst: false })
      .order('course->published_at', { ascending: false, nullsFirst: false })
      .order('course->created_at', { ascending: false });
  } else if (queryOptions.sort === 'price-asc' || queryOptions.sort === 'price-desc') {
    query = query
      .order(`course->${priceColumn}`, { ascending: queryOptions.sort === 'price-asc', nullsFirst: false })
      .order('course->published_at', { ascending: false, nullsFirst: false })
      .order('course->id', { ascending: true });
  } else {
    query = query
      .order('course->published_at', { ascending: false, nullsFirst: false })
      .order('course->created_at', { ascending: false })
      .order('course->id', { ascending: true });
  }

  const { data, error, count } = await query.range(offset, offset + queryOptions.pageSize - 1);
  if (error) throw error;

  return {
    courses: ((data || []) as unknown as PublicCourseWithStats[]).map(shapePublicCourse),
    totalCount: count || 0,
  };
}

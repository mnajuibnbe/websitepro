import {
  aggregateHomepageStats,
  chooseHomepageTestimonials,
  type HomepageStats,
  type HomepageTestimonial,
} from '../lib/homepageMarketing';
import { supabase } from '../lib/supabase';
import type { PublicCourseWithStats } from '../types/database.types';

interface PlatformReviewRow {
  review_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface LegacyTestimonialRow {
  id: number;
  reviewer_name: string;
  quote: string;
  source: 'legacy_import';
}

const STATS_PAGE_SIZE = 1_000;

export async function fetchHomepageTestimonials(
  platformLimit = 3,
  legacyLimit = 8,
): Promise<HomepageTestimonial[]> {
  const { data, error } = await supabase.rpc('get_public_course_reviews', {
    p_course_id: null,
    p_limit: platformLimit,
  });

  if (error) throw error;
  const platformReviews = ((data || []) as PlatformReviewRow[]).map(review => ({
    ...review,
    source: 'platform' as const,
  }));

  if (platformReviews.length > 0) return chooseHomepageTestimonials(platformReviews, []);

  const { data: legacyData, error: legacyError } = await supabase
    .from('legacy_testimonials')
    .select('id, reviewer_name, quote, source')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .limit(legacyLimit);

  if (legacyError) throw legacyError;
  const legacyTestimonials = ((legacyData || []) as LegacyTestimonialRow[]).map(testimonial => ({
    review_id: `legacy-${testimonial.id}`,
    reviewer_name: testimonial.reviewer_name,
    rating: null,
    comment: testimonial.quote,
    created_at: null,
    source: testimonial.source,
  }));

  return chooseHomepageTestimonials(platformReviews, legacyTestimonials);
}

export async function fetchHomepageStats(): Promise<HomepageStats> {
  const rows: PublicCourseWithStats[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .rpc('get_public_courses_with_stats')
      .range(offset, offset + STATS_PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data || []) as unknown as PublicCourseWithStats[];
    rows.push(...page);

    if (page.length < STATS_PAGE_SIZE) break;
    offset += STATS_PAGE_SIZE;
  }

  return aggregateHomepageStats(rows);
}

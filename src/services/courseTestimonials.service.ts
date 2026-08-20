import { supabase } from '../lib/supabase';

export interface CourseTestimonial {
  id: number;
  reviewerName: string;
  quote: string;
  sourceLabel: string;
}

interface LegacyTestimonialRow {
  id: number;
  reviewer_name: string;
  quote: string;
  source_platform: string | null;
}

/** Concise, transparent attribution label. Only says "Udemy" when the admin-recorded source actually names Udemy. */
function sourceLabel(sourcePlatform: string | null): string {
  if (sourcePlatform?.trim().toLowerCase().includes('udemy')) return 'Udemy learner';
  return 'Previous learner';
}

export async function fetchCourseTestimonials(limit = 3): Promise<CourseTestimonial[]> {
  const { data, error } = await supabase
    .from('legacy_testimonials')
    .select('id, reviewer_name, quote, source_platform')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return ((data || []) as LegacyTestimonialRow[]).map(row => ({
    id: row.id,
    reviewerName: row.reviewer_name,
    quote: row.quote,
    sourceLabel: sourceLabel(row.source_platform),
  }));
}

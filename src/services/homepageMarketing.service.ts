import {
  chooseHomepageTestimonials,
  type HomepagePreviewLesson,
  type HomepageStats,
  type HomepageTestimonial,
} from '../lib/homepageMarketing';
import { supabase } from '../lib/supabase';

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
  const { data, error } = await supabase
    .from('homepage_marketing_settings')
    .select('students_value, courses_value, learning_hours_value')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return {
    studentsValue: data.students_value,
    coursesValue: data.courses_value,
    learningHoursValue: data.learning_hours_value,
  };
}

export async function fetchHomepagePreviewLessons(): Promise<HomepagePreviewLesson[]> {
  const { data, error } = await supabase.rpc('get_homepage_preview_lessons');
  if (error) throw error;
  return ((data || []) as Array<{ lesson_id: string; lesson_title: string; course_id: string; course_title: string }>).map(row => ({
    lessonId: row.lesson_id,
    lessonTitle: row.lesson_title,
    courseId: row.course_id,
    courseTitle: row.course_title,
  }));
}

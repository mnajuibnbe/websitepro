import {
  chooseHomepageTestimonials,
  DEFAULT_FREE_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_INSTRUCTOR_CONTENT,
  DEFAULT_LEARNING_METHOD_CONTENT,
  DEFAULT_OUTCOMES_CONTENT,
  DEFAULT_WHY_CHOOSE_US_CONTENT,
  mapFreeContentItemFromRow,
  type HomepageFaqEntry,
  type HomepageFreeContentSection,
  type HomepageHeroContent,
  type HomepageInstructorContent,
  type HomepageLearningMethodContent,
  type HomepageOutcomesContent,
  type HomepagePreviewLesson,
  type HomepageSectionKey,
  type HomepageStats,
  type HomepageTestimonial,
  type HomepageWhyChooseUsContent,
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
  title: string;
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
    title: 'Verified Tutiba Student',
  }));

  if (platformReviews.length > 0) return chooseHomepageTestimonials(platformReviews, []);

  const { data: legacyData, error: legacyError } = await supabase
    .from('legacy_testimonials')
    .select('id, reviewer_name, quote, source, title')
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
    title: testimonial.title || 'Tutiba Student',
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
  return ((data || []) as Array<{ lesson_id: string; lesson_title: string; course_id: string; course_title: string; course_thumbnail: string | null }>).map(row => ({
    lessonId: row.lesson_id,
    lessonTitle: row.lesson_title,
    courseId: row.course_id,
    courseTitle: row.course_title,
    courseThumbnail: row.course_thumbnail,
  }));
}

export async function fetchHomepageHero(): Promise<HomepageHeroContent> {
  const { data, error } = await supabase.from('homepage_hero_settings').select('eyebrow_text,headline_prefix,headline_highlight,subtext,cta_label,trust_badges,video_badge_text,video_heading,video_description,video_play_label').eq('id', 1).single();
  if (error) throw error;
  return {
    eyebrowText: data.eyebrow_text,
    headlinePrefix: data.headline_prefix,
    headlineHighlight: data.headline_highlight,
    subtext: data.subtext,
    ctaLabel: data.cta_label,
    trustBadges: data.trust_badges || DEFAULT_HERO_CONTENT.trustBadges,
    videoBadgeText: data.video_badge_text,
    videoHeading: data.video_heading,
    videoDescription: data.video_description,
    videoPlayLabel: data.video_play_label,
  };
}

export async function fetchHomepageWhyChooseUs(): Promise<HomepageWhyChooseUsContent> {
  const { data, error } = await supabase.from('homepage_why_choose_us_settings').select('eyebrow_text,heading_prefix,heading_highlight,subtext,cta_label,features').eq('id', 1).single();
  if (error) throw error;
  return { eyebrowText: data.eyebrow_text, headingPrefix: data.heading_prefix, headingHighlight: data.heading_highlight, subtext: data.subtext, ctaLabel: data.cta_label, features: data.features || DEFAULT_WHY_CHOOSE_US_CONTENT.features };
}

export async function fetchHomepageLearningMethod(): Promise<HomepageLearningMethodContent> {
  const { data, error } = await supabase.from('homepage_learning_method_settings').select('eyebrow_text,heading,subtext,curriculum').eq('id', 1).single();
  if (error) throw error;
  return { eyebrowText: data.eyebrow_text, heading: data.heading, subtext: data.subtext, curriculum: data.curriculum || DEFAULT_LEARNING_METHOD_CONTENT.curriculum };
}

export async function fetchHomepageInstructor(): Promise<HomepageInstructorContent> {
  const { data, error } = await supabase.from('homepage_instructor_settings').select('eyebrow_text,heading_prefix,heading_highlight,bio,instructor_name,photo_url,experience_badge_value,experience_badge_label,credential_pills,bullets').eq('id', 1).single();
  if (error) throw error;
  return {
    eyebrowText: data.eyebrow_text,
    headingPrefix: data.heading_prefix,
    headingHighlight: data.heading_highlight,
    bio: data.bio,
    instructorName: data.instructor_name,
    photoUrl: data.photo_url,
    experienceBadgeValue: data.experience_badge_value,
    experienceBadgeLabel: data.experience_badge_label,
    credentialPills: data.credential_pills || DEFAULT_INSTRUCTOR_CONTENT.credentialPills,
    bullets: data.bullets || DEFAULT_INSTRUCTOR_CONTENT.bullets,
  };
}

export async function fetchHomepageOutcomes(): Promise<HomepageOutcomesContent> {
  const { data, error } = await supabase.from('homepage_outcomes_settings').select('eyebrow_text,heading_prefix,heading_highlight,outcomes').eq('id', 1).single();
  if (error) throw error;
  return { eyebrowText: data.eyebrow_text, headingPrefix: data.heading_prefix, headingHighlight: data.heading_highlight, outcomes: data.outcomes || DEFAULT_OUTCOMES_CONTENT.outcomes };
}

export async function fetchHomepageFreeContent(): Promise<HomepageFreeContentSection> {
  const { data, error } = await supabase.from('homepage_free_content_settings').select('heading,subtext,items,view_all_label,view_all_url').eq('id', 1).single();
  if (error) throw error;
  return { heading: data.heading, subtext: data.subtext, items: (data.items || []).map(mapFreeContentItemFromRow), viewAllLabel: data.view_all_label, viewAllUrl: data.view_all_url };
}

export async function fetchHomepageFaqEntries(): Promise<HomepageFaqEntry[]> {
  const { data, error } = await supabase.from('homepage_faq_entries').select('id,question,answer,display_order,is_published').eq('is_published', true).order('display_order');
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, question: row.question, answer: row.answer, displayOrder: row.display_order, isPublished: row.is_published }));
}

export async function fetchHomepageSectionLayout(): Promise<HomepageSectionKey[]> {
  const { data, error } = await supabase.from('homepage_section_layout').select('section_key,is_visible').eq('is_visible', true).order('display_order');
  if (error) throw error;
  return (data || []).map(row => row.section_key as HomepageSectionKey);
}

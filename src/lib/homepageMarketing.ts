export interface HomepageStats {
  studentsValue: string;
  coursesValue: string;
  learningHoursValue: string;
}

export interface HomepagePreviewLesson {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
}

export const PRIMARY_DIPLOMA_PATH = '/course/e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0';
export const PRIMARY_DIPLOMA_CTA = 'Start Part 1 — EGP 300';

export interface HomepageTestimonial {
  review_id: string;
  reviewer_name: string;
  rating: number | null;
  comment: string;
  created_at: string | null;
  source: 'platform' | 'legacy_import';
}

export function chooseHomepageTestimonials(
  platformReviews: HomepageTestimonial[],
  legacyTestimonials: HomepageTestimonial[],
) {
  return platformReviews.length > 0 ? platformReviews : legacyTestimonials;
}

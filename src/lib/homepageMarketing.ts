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

export const PRIMARY_DIPLOMA_COURSE_ID = 'e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0';
export const PRIMARY_DIPLOMA_PATH = `/course/${PRIMARY_DIPLOMA_COURSE_ID}`;
/** Fallback only, shown before the real dual-currency price resolves. Never a final display value. */
export const PRIMARY_DIPLOMA_CTA_FALLBACK = 'Enroll in Part 1';

export function formatHomepageCourseCta(courseTitle: string, price: string) {
  const partName = courseTitle.match(/\bPart\s+\d+\b/i)?.[0] || courseTitle;
  return `Enroll in ${partName} — ${price}`;
}

export interface HomepageTestimonial {
  review_id: string;
  reviewer_name: string;
  rating: number | null;
  comment: string;
  created_at: string | null;
  source: 'platform' | 'legacy_import';
  title: string;
}

export function chooseHomepageTestimonials(
  platformReviews: HomepageTestimonial[],
  legacyTestimonials: HomepageTestimonial[],
) {
  return platformReviews.length > 0 ? platformReviews : legacyTestimonials;
}

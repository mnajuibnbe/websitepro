import type { PublicCourseWithStats } from '../types/database.types';

export interface HomepageStats {
  publishedCourseCount: number;
  activeEnrollmentCount: number;
  averageRating: number;
  approvedReviewCount: number;
}

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

export function aggregateHomepageStats(rows: PublicCourseWithStats[]): HomepageStats {
  const totals = rows.reduce((result, row) => {
    const reviewCount = Number(row.review_count || 0);
    const averageRating = Number(row.average_rating || 0);

    return {
      activeEnrollmentCount: result.activeEnrollmentCount + Number(row.enrolled_student_count || 0),
      approvedReviewCount: result.approvedReviewCount + reviewCount,
      ratingTotal: result.ratingTotal + (averageRating * reviewCount),
    };
  }, { activeEnrollmentCount: 0, approvedReviewCount: 0, ratingTotal: 0 });

  return {
    publishedCourseCount: rows.length,
    activeEnrollmentCount: totals.activeEnrollmentCount,
    averageRating: totals.approvedReviewCount > 0 ? totals.ratingTotal / totals.approvedReviewCount : 0,
    approvedReviewCount: totals.approvedReviewCount,
  };
}

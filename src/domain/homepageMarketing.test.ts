import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateHomepageStats, chooseHomepageTestimonials, type HomepageTestimonial } from '../lib/homepageMarketing';
import type { PublicCourseWithStats } from '../types/database.types';

function row(overrides: Partial<PublicCourseWithStats>): PublicCourseWithStats {
  return {
    course: {} as PublicCourseWithStats['course'],
    lessons_count: 0,
    average_rating: 0,
    review_count: 0,
    enrolled_student_count: 0,
    ...overrides,
  };
}

test('homepage metrics preserve real zero values', () => {
  assert.deepEqual(aggregateHomepageStats([]), {
    publishedCourseCount: 0,
    activeEnrollmentCount: 0,
    averageRating: 0,
    approvedReviewCount: 0,
  });
});

test('homepage rating is weighted by approved review count', () => {
  assert.deepEqual(aggregateHomepageStats([
    row({ average_rating: 5, review_count: 1, enrolled_student_count: 2 }),
    row({ average_rating: 3, review_count: 3, enrolled_student_count: 4 }),
  ]), {
    publishedCourseCount: 2,
    activeEnrollmentCount: 6,
    averageRating: 3.5,
    approvedReviewCount: 4,
  });
});

const platformReview: HomepageTestimonial = {
  review_id: 'platform-review',
  reviewer_name: 'Platform learner',
  rating: 5,
  comment: 'Organic review',
  created_at: '2026-08-01T00:00:00Z',
  source: 'platform',
};

const legacyTestimonial: HomepageTestimonial = {
  review_id: 'legacy-1',
  reviewer_name: 'Legacy learner',
  rating: null,
  comment: 'Legacy testimonial',
  created_at: null,
  source: 'legacy_import',
};

test('organic platform reviews always take priority over legacy testimonials', () => {
  assert.deepEqual(chooseHomepageTestimonials([platformReview], [legacyTestimonial]), [platformReview]);
  assert.deepEqual(chooseHomepageTestimonials([], [legacyTestimonial]), [legacyTestimonial]);
});

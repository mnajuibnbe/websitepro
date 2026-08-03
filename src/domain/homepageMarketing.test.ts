import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseHomepageTestimonials, type HomepageTestimonial } from '../lib/homepageMarketing';

const platformReview: HomepageTestimonial = {
  review_id: 'platform-review',
  reviewer_name: 'Platform learner',
  rating: 5,
  comment: 'Organic review',
  created_at: '2026-08-01T00:00:00Z',
  source: 'platform',
  title: 'Verified Tutiba Student',
};

const legacyTestimonial: HomepageTestimonial = {
  review_id: 'legacy-1',
  reviewer_name: 'Legacy learner',
  rating: null,
  comment: 'Legacy testimonial',
  created_at: null,
  source: 'legacy_import',
  title: 'Tutiba Student',
};

test('organic platform reviews always take priority over legacy testimonials', () => {
  assert.deepEqual(chooseHomepageTestimonials([platformReview], [legacyTestimonial]), [platformReview]);
  assert.deepEqual(chooseHomepageTestimonials([], [legacyTestimonial]), [legacyTestimonial]);
});

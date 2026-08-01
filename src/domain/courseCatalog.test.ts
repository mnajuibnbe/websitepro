import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCourseToCardProps, COURSE_IMAGE_FALLBACK } from '../lib/courseCard.js';
import { DEFAULT_PRICING_CONTEXT } from '../lib/pricing.js';
import {
  courseCatalogCacheKey,
  shapePublicCourse,
} from '../services/courseCatalog.service.js';
import type { Course, PublicCourseWithStats } from '../types/database.types.js';

const baseCourse: Course = {
  id: '4bfb3a53-b68d-4c44-b366-cea65deae507',
  title: 'Catalog course',
  slug: null,
  short_description: 'Short description',
  description: 'Long description',
  price: 10,
  price_egp: 300,
  price_usd: 10,
  duration: null,
  category: 'Skin Care',
  learning_outcomes: [],
  requirements: [],
  target_audience: [],
  thumbnail: null,
  cover_image: null,
  trailer_video: null,
  status: 'published',
  instructor_id: null,
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  is_featured: true,
  home_order: 1,
  certificate_enabled: true,
  sequential_learning: false,
  drip_enabled: false,
  discussion_enabled: false,
  seo_title: null,
  seo_description: null,
  seo_keywords: null,
  published_at: '2026-08-01T00:00:00Z',
  archived_at: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

test('public course stats are shaped once and mapped to complete CourseCard props', () => {
  const row: PublicCourseWithStats = {
    course: baseCourse,
    lessons_count: 7,
    average_rating: '4.75',
    review_count: 12,
    enrolled_student_count: 42,
  };

  const course = shapePublicCourse(row);
  const props = mapCourseToCardProps(course, DEFAULT_PRICING_CONTEXT);

  assert.equal(course.enrolledStudentCount, 42);
  assert.equal(props.lessonsCount, 7);
  assert.equal(props.rating, 4.75);
  assert.equal(props.reviewCount, 12);
  assert.equal(props.imageUrl, COURSE_IMAGE_FALLBACK);
  assert.equal(props.price, 'USD 10');
});

test('catalog cache keys de-duplicate semantically identical filter arrays', () => {
  const first = courseCatalogCacheKey({ filters: { categories: ['Skin Care', 'Hair Care'] } });
  const second = courseCatalogCacheKey({ filters: { categories: ['Hair Care', 'Skin Care'] } });
  assert.equal(first, second);
});

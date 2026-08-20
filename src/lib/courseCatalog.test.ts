import assert from 'node:assert/strict';
import test from 'node:test';
import type { Course } from '../types/database.types.js';
import { EMPTY_CATALOG_FILTERS, filterAndSortCourses } from './courseCatalog.js';

const course = (overrides: Partial<Course>): Course => ({
  id: crypto.randomUUID(), title: 'Course', slug: null, short_description: null, description: null,
  price: 0, price_egp: 0, price_usd: 0, duration: null, category: null,
  learning_outcomes: [], requirements: [], target_audience: [],
  thumbnail: null, cover_image: null, trailer_video: null,
  status: 'published', instructor_id: null, level: 'all_levels', language: null, visibility: 'public',
  is_featured: false, is_bestseller: false, curriculum_highlights: null, home_order: null, certificate_enabled: false, display_rating: null, display_rating_count: null, display_rating_source: null, display_rating_source_url: null, display_rating_verified_at: null, display_students_count: null, sequential_learning: false, drip_enabled: false,
  discussion_enabled: false, seo_title: null, seo_description: null, seo_keywords: null,
  published_at: null, archived_at: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

test('catalog search, category, level and price filters use actual course fields', () => {
  const courses = [
    course({ title: 'Skin Diploma', category: 'Skin care', level: 'beginner', price: 199, price_usd: 199 }),
    course({ title: 'Free Hair', category: 'Hair care', level: 'advanced', price: 0 }),
  ];
  assert.deepEqual(filterAndSortCourses(courses, { ...EMPTY_CATALOG_FILTERS, search: 'skin' }).map(c => c.title), ['Skin Diploma']);
  assert.deepEqual(filterAndSortCourses(courses, { ...EMPTY_CATALOG_FILTERS, categories: ['Hair care'], price: 'free' }).map(c => c.title), ['Free Hair']);
  assert.deepEqual(filterAndSortCourses(courses, { ...EMPTY_CATALOG_FILTERS, levels: ['beginner'], price: 'paid' }).map(c => c.title), ['Skin Diploma']);
});

test('catalog sorting supports newest and both price directions', () => {
  const courses = [course({ title: 'Older', price: 20, price_usd: 20 }), course({ title: 'Newer', price: 10, price_usd: 10, created_at: '2026-02-01T00:00:00Z' })];
  assert.deepEqual(filterAndSortCourses(courses, EMPTY_CATALOG_FILTERS).map(c => c.title), ['Newer', 'Older']);
  assert.deepEqual(filterAndSortCourses(courses, { ...EMPTY_CATALOG_FILTERS, sort: 'price-asc' }).map(c => c.title), ['Newer', 'Older']);
  assert.deepEqual(filterAndSortCourses(courses, { ...EMPTY_CATALOG_FILTERS, sort: 'price-desc' }).map(c => c.title), ['Older', 'Newer']);
});

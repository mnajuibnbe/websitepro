import { COURSE_DESCRIPTION_MIN_LENGTH, COURSE_SUMMARY_MIN_LENGTH } from '../domain/courseReadiness';
import { richTextVisibleLength } from './richTextHtml';

export interface CourseFormValues {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceEgp: string;
  priceUsd: string;
  learningOutcomes?: string[];
  requirements?: string[];
  targetAudience?: string[];
  curriculumHighlights?: string[];
}

export function sanitizeCourseSlug(input: string): string {
  return input.trim().toLowerCase().replace(/[^\w\u0621-\u064A\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export function validateCourseForm(values: CourseFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.title.trim()) errors.title = 'Enter a course title.';
  if (values.shortDescription.trim().length < COURSE_SUMMARY_MIN_LENGTH) errors.shortDescription = `Enter at least ${COURSE_SUMMARY_MIN_LENGTH} characters for the course summary.`;
  if (richTextVisibleLength(values.description) < COURSE_DESCRIPTION_MIN_LENGTH) errors.description = `Enter at least ${COURSE_DESCRIPTION_MIN_LENGTH} characters for the course description.`;
  const slug = values.slug.trim() ? sanitizeCourseSlug(values.slug) : '';
  if (values.slug.trim() && !slug) errors.slug = 'Enter a valid URL slug.';
  if (!/^\d+(\.\d{1,2})?$/.test(values.priceEgp)) errors.priceEgp = 'Enter a valid EGP price with no more than 2 decimal places.';
  if (!/^\d+(\.\d{1,2})?$/.test(values.priceUsd)) errors.priceUsd = 'Enter a valid USD price with no more than 2 decimal places.';
  if (!errors.priceEgp && !errors.priceUsd && ((Number(values.priceEgp) === 0) !== (Number(values.priceUsd) === 0))) errors.priceUsd = 'Free courses must use zero for both currencies.';
  if (values.learningOutcomes?.some(item => !item.trim())) errors.learningOutcomes = 'Remove or complete every empty learning outcome.';
  if (values.requirements?.some(item => !item.trim())) errors.requirements = 'Remove or complete every empty requirement.';
  if (values.targetAudience?.some(item => !item.trim())) errors.targetAudience = 'Remove or complete every empty audience item.';
  if (values.curriculumHighlights?.some(item => !item.trim())) errors.curriculumHighlights = 'Remove or complete every empty highlight.';
  return errors;
}

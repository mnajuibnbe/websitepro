export interface CourseFormValues {
  title: string;
  slug: string;
  priceEgp: string;
  priceUsd: string;
}

export function sanitizeCourseSlug(input: string): string {
  return input.trim().toLowerCase().replace(/[^\w\u0621-\u064A\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export function validateCourseForm(values: CourseFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.title.trim()) errors.title = 'Enter a course title.';
  const slug = values.slug.trim() ? sanitizeCourseSlug(values.slug) : '';
  if (values.slug.trim() && !slug) errors.slug = 'Enter a valid URL slug.';
  if (!/^\d+(\.\d{1,2})?$/.test(values.priceEgp)) errors.priceEgp = 'Enter a valid EGP price with no more than 2 decimal places.';
  if (!/^\d+(\.\d{1,2})?$/.test(values.priceUsd)) errors.priceUsd = 'Enter a valid USD price with no more than 2 decimal places.';
  if (!errors.priceEgp && !errors.priceUsd && ((Number(values.priceEgp) === 0) !== (Number(values.priceUsd) === 0))) errors.priceUsd = 'Free courses must use zero for both currencies.';
  return errors;
}

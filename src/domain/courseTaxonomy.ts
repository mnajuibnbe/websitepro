export const COURSE_CATEGORIES = [
  { value: 'Skin Care', label: 'Skin care', description: 'Skin health, products, routines, and professional treatments.' },
  { value: 'Hair Care', label: 'Hair care', description: 'Hair and scalp health, products, and professional treatments.' },
  { value: 'Professional Practice', label: 'Professional practice', description: 'Business, consultation, safety, and client-care skills.' },
  { value: 'Cosmetic Science', label: 'Cosmetic science', description: 'Ingredients, formulation, product evaluation, and evidence.' },
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number]['value'];

export const COURSE_LANGUAGES = ['Arabic', 'English'] as const;

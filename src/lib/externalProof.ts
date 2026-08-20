import type { Course } from '../types/database.types';

export interface ExternalProof {
  rating: number;
  source: string;
  sourceUrl: string | null;
  ratingCount: number | null;
  studentsCount: number | null;
}

/** Verified external social proof (e.g. Udemy), when an admin has configured it. Never fabricated, never a native Tutiba rating. */
export function resolveExternalProof(course: Pick<Course, 'display_rating' | 'display_rating_count' | 'display_rating_source' | 'display_rating_source_url' | 'display_students_count'>): ExternalProof | null {
  const rating = Number(course.display_rating);
  const source = course.display_rating_source?.trim();
  if (!Number.isFinite(rating) || rating <= 0 || !source) return null;
  return {
    rating,
    source,
    sourceUrl: course.display_rating_source_url?.trim() || null,
    ratingCount: course.display_rating_count && course.display_rating_count > 0 ? course.display_rating_count : null,
    studentsCount: course.display_students_count && course.display_students_count > 0 ? course.display_students_count : null,
  };
}

/** Concise, dynamic language label derived from real course data. Never a hardcoded claim. */
export function courseLanguageLabel(language: string | null | undefined): string | null {
  const normalized = language?.trim();
  if (!normalized) return null;
  return normalized === 'Arabic' ? 'Arabic course' : `${normalized} course`;
}

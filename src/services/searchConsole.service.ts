import { supabase } from '../lib/supabase';

export interface SearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePerformance {
  pageUrl: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: SearchConsoleQueryRow[];
  rangeStart: string;
  rangeEnd: string;
}

/** Thrown when the server reports Search Console itself isn't configured/reachable (503) -- distinct from a one-off request failure, so the panel can show a clear "not available" state instead of a generic error. */
export class SearchConsoleUnavailableError extends Error {}

interface PerformanceResponsePayload extends Partial<SearchConsolePerformance> {
  error?: string;
}

async function fetchPerformance(params: URLSearchParams): Promise<SearchConsolePerformance> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`/api/search-console/performance?${params.toString()}`, {
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}` },
  });
  const payload = await response.json().catch(() => null) as PerformanceResponsePayload | null;

  if (response.status === 503) {
    throw new SearchConsoleUnavailableError(payload?.error || 'Search Console data is not available right now.');
  }
  if (!response.ok) {
    throw new Error(payload?.error || 'Could not load Search Console data.');
  }
  if (!payload || typeof payload.clicks !== 'number' || !Array.isArray(payload.topQueries)) {
    throw new Error('Received an unexpected response from the Search Console service.');
  }
  return payload as SearchConsolePerformance;
}

/** Calls the server-side Search Console proxy for a published blog post (GET /api/search-console/performance?type=blog_post). */
export function fetchBlogPostPerformance(slug: string): Promise<SearchConsolePerformance> {
  return fetchPerformance(new URLSearchParams({ type: 'blog_post', slug }));
}

/** Calls the server-side Search Console proxy for a published course (GET /api/search-console/performance?type=course). */
export function fetchCoursePerformance(courseId: string): Promise<SearchConsolePerformance> {
  return fetchPerformance(new URLSearchParams({ type: 'course', id: courseId }));
}

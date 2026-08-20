import { getSearchConsoleClient } from '../config/google.js';

/**
 * tutiba.com is verified in Search Console as a Domain property, not a URL-prefix
 * property -- the siteUrl for searchanalytics.query must be `sc-domain:tutiba.com`
 * (no protocol), which is how Search Console covers http/https and all subdomains
 * under one property. Page-level filtering below still uses the full page URL.
 */
const SITE_URL = 'sc-domain:tutiba.com';
const SITE_ORIGIN = 'https://tutiba.com';

// Search Console data is typically incomplete for the most recent 2-3 days -- querying
// through "today" would show an artificial dip that isn't a real traffic drop.
const DATA_LAG_DAYS = 3;
const RANGE_DAYS = 28;
const TOP_QUERY_LIMIT = 10;

// A few hours per the SEO editor spec: GSC data itself only updates roughly daily, so
// re-querying more often than this buys nothing and just spends API quota. Matches this
// codebase's existing convention for external-API caching (see video.controller.ts's
// driveMetadataCache) -- an in-memory Map, not persisted, good enough at this project's
// scale and traffic (admin-only, low request volume).
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type SearchConsolePageType = 'blog_post' | 'course';

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

export type SearchConsoleFailureReason = 'missing_credentials' | 'api_error';

/**
 * Flat shape (not a discriminated union) matching this codebase's existing convention
 * for external-API results -- see gemini.service.ts's GeminiInsightsResult for why
 * (this tsconfig doesn't reliably narrow two-branch unions).
 */
export interface SearchConsoleResult {
  ok: boolean;
  data?: SearchConsolePerformance;
  reason?: SearchConsoleFailureReason;
  message?: string;
}

export function buildPageUrl(type: SearchConsolePageType, identifier: string): string {
  // Course ids are validated case-insensitively (UUID_PATTERN has the /i flag in
  // search-console.routes.ts) but the site's actual course URLs are always lowercase
  // (Postgres normalizes uuid columns on output) -- normalize here so a differently-cased
  // id (e.g. typed by hand into the address bar) still matches the real indexed URL
  // instead of silently returning zero rows for a page that does have real traffic.
  return type === 'course' ? `${SITE_ORIGIN}/course/${identifier.toLowerCase()}` : `${SITE_ORIGIN}/blog/${identifier}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(now: Date = new Date()): { startDate: string; endDate: string } {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - DATA_LAG_DAYS);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (RANGE_DAYS - 1));
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

interface CacheEntry { data: SearchConsolePerformance; expiresAt: number }
const performanceCache = new Map<string, CacheEntry>();

export interface SearchConsoleDependencies {
  getSearchConsoleClient: typeof getSearchConsoleClient;
}

const defaultDependencies: SearchConsoleDependencies = { getSearchConsoleClient };

export async function fetchPagePerformance(pageUrl: string, deps: SearchConsoleDependencies = defaultDependencies): Promise<SearchConsoleResult> {
  const cached = performanceCache.get(pageUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, data: cached.data };
  }

  let client;
  try {
    client = deps.getSearchConsoleClient();
  } catch (error) {
    return { ok: false, reason: 'missing_credentials', message: error instanceof Error ? error.message : 'Search Console is not configured.' };
  }

  const { startDate, endDate } = resolveDateRange();
  const pageFilterGroup = { filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }] };

  // Two separate queries, not one dimensions:['query'] call summed client-side: Search
  // Console omits individual low-volume query rows from a dimensioned report (privacy
  // thresholding) while still counting them in the undimensioned site/page aggregate --
  // summing only the returned query rows would systematically undercount clicks/
  // impressions for any page with long-tail queries. The no-dimension call is the only
  // way to get true totals.
  try {
    const [totalsResponse, queriesResponse] = await Promise.all([
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensionFilterGroups: [pageFilterGroup] },
      }),
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ['query'], dimensionFilterGroups: [pageFilterGroup], rowLimit: TOP_QUERY_LIMIT },
      }),
    ]);

    const totalsRow = totalsResponse.data.rows?.[0];
    const topQueries: SearchConsoleQueryRow[] = (queriesResponse.data.rows || []).map((row) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    const data: SearchConsolePerformance = {
      pageUrl,
      clicks: totalsRow?.clicks || 0,
      impressions: totalsRow?.impressions || 0,
      ctr: totalsRow?.ctr || 0,
      position: totalsRow?.position || 0,
      topQueries,
      rangeStart: startDate,
      rangeEnd: endDate,
    };

    // Only successful responses are cached -- a transient failure (quota, network) should
    // self-heal on the admin's next visit rather than being pinned as an error for 6 hours.
    performanceCache.set(pageUrl, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Search Console API error';
    console.error('[SearchConsole] searchanalytics.query failed', { pageUrl, message });
    return { ok: false, reason: 'api_error', message };
  }
}

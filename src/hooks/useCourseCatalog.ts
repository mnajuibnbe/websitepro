import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  courseCatalogCacheKey,
  fetchCourseCatalog,
  type CourseCatalogQuery,
  type CourseCatalogResult,
} from '../services/courseCatalog.service';

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  expiresAt: number;
  promise?: Promise<CourseCatalogResult>;
  value?: CourseCatalogResult;
}

const catalogCache = new Map<string, CacheEntry>();

function loadCatalog(options: CourseCatalogQuery): Promise<CourseCatalogResult> {
  const key = courseCatalogCacheKey(options);
  const now = Date.now();
  if (catalogCache.size > 100) {
    for (const [cachedKey, entry] of catalogCache) {
      if (!entry.promise && entry.expiresAt <= now) catalogCache.delete(cachedKey);
    }
  }
  const cached = catalogCache.get(key);

  if (cached?.promise) return cached.promise;
  if (cached?.value && cached.expiresAt > now) return Promise.resolve(cached.value);

  const promise = fetchCourseCatalog(options)
    .then((value) => {
      catalogCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    })
    .catch((error) => {
      catalogCache.delete(key);
      throw error;
    });

  catalogCache.set(key, { promise, expiresAt: now + CACHE_TTL_MS });
  return promise;
}

export function useCourseCatalog(options: CourseCatalogQuery = {}) {
  const key = courseCatalogCacheKey(options);
  const stableOptions = useMemo(() => options, [key]);
  const [result, setResult] = useState<CourseCatalogResult>({ courses: [], totalCount: 0 });
  const [isLoading, setIsLoading] = useState(options.enabled !== false);
  const [error, setError] = useState<Error | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => {
    catalogCache.delete(key);
    setRequestVersion((version) => version + 1);
  }, [key]);

  useEffect(() => {
    if (stableOptions.enabled === false) {
      setResult({ courses: [], totalCount: 0 });
      setIsLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    loadCatalog(stableOptions)
      .then((nextResult) => {
        if (active) setResult(nextResult);
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError instanceof Error ? nextError : new Error('Unable to load courses'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key, requestVersion, stableOptions]);

  return { ...result, isLoading, error, refetch };
}

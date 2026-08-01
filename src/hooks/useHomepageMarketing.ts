import { useCallback, useEffect, useState } from 'react';
import type { HomepageStats, HomepageTestimonial } from '../lib/homepageMarketing';
import {
  fetchHomepageTestimonials,
  fetchHomepageStats,
} from '../services/homepageMarketing.service';

interface AsyncHomepageData<T> {
  data: T;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

function useHomepageData<T>(loader: () => Promise<T>, initialData: T): AsyncHomepageData<T> {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => setRequestVersion(version => version + 1), []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    loader()
      .then(nextData => {
        if (active) setData(nextData);
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError instanceof Error ? nextError : new Error('Unable to load homepage data'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loader, requestVersion]);

  return { data, error, isLoading, refetch };
}

const EMPTY_STATS: HomepageStats = {
  publishedCourseCount: 0,
  activeEnrollmentCount: 0,
  averageRating: 0,
  approvedReviewCount: 0,
};

const loadHomepageTestimonials = () => fetchHomepageTestimonials(3, 8);

export function useHomepageTestimonials() {
  return useHomepageData<HomepageTestimonial[]>(loadHomepageTestimonials, []);
}

export function useHomepageStats() {
  return useHomepageData<HomepageStats>(fetchHomepageStats, EMPTY_STATS);
}

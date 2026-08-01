import { useCallback, useEffect, useState } from 'react';
import { fetchCourseCategories, type CourseCategory } from '../services/courseCategories.service';

export function useCourseCategories(includeInactive = false) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => setRequestVersion(version => version + 1), []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    fetchCourseCategories(includeInactive)
      .then(data => { if (active) setCategories(data); })
      .catch(nextError => { if (active) setError(nextError instanceof Error ? nextError : new Error('Unable to load categories')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [includeInactive, requestVersion]);

  return { categories, isLoading, error, refetch };
}

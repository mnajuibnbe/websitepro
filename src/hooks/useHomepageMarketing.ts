import { useCallback, useEffect, useState } from 'react';
import type { HomepagePreviewLesson, HomepageStats, HomepageTestimonial } from '../lib/homepageMarketing';
import {
  DEFAULT_FREE_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_INSTRUCTOR_CONTENT,
  DEFAULT_LEARNING_METHOD_CONTENT,
  DEFAULT_OUTCOMES_CONTENT,
  DEFAULT_SECTION_LAYOUT,
  DEFAULT_WHY_CHOOSE_US_CONTENT,
} from '../lib/homepageMarketing';
import {
  fetchHomepageTestimonials,
  fetchHomepageStats,
  fetchHomepagePreviewLessons,
  fetchHomepageHero,
  fetchHomepageWhyChooseUs,
  fetchHomepageLearningMethod,
  fetchHomepageInstructor,
  fetchHomepageOutcomes,
  fetchHomepageFreeContent,
  fetchHomepageFaqEntries,
  fetchHomepageSectionLayout,
} from '../services/homepageMarketing.service';
import { useCourseCatalog } from './useCourseCatalog';
import { usePricingContext } from '../contexts/PricingContext';
import { mapCourseToCardProps } from '../lib/courseCard';
import { formatHomepageCourseCta, PRIMARY_DIPLOMA_COURSE_ID, PRIMARY_DIPLOMA_CTA_FALLBACK, PRIMARY_DIPLOMA_PATH } from '../lib/homepageMarketing';

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
  studentsValue: '1,000+',
  coursesValue: '8+',
  learningHoursValue: '200+',
};

const loadHomepageTestimonials = () => fetchHomepageTestimonials(3, 8);

export function useHomepageTestimonials() {
  return useHomepageData<HomepageTestimonial[]>(loadHomepageTestimonials, []);
}

export function useHomepageStats() {
  return useHomepageData<HomepageStats>(fetchHomepageStats, EMPTY_STATS);
}

export function useHomepagePreviewLessons() {
  return useHomepageData<HomepagePreviewLesson[]>(fetchHomepagePreviewLessons, []);
}

export function useHomepageHero() {
  return useHomepageData(fetchHomepageHero, DEFAULT_HERO_CONTENT);
}

export function useHomepageWhyChooseUs() {
  return useHomepageData(fetchHomepageWhyChooseUs, DEFAULT_WHY_CHOOSE_US_CONTENT);
}

export function useHomepageLearningMethodContent() {
  return useHomepageData(fetchHomepageLearningMethod, DEFAULT_LEARNING_METHOD_CONTENT);
}

export function useHomepageInstructor() {
  return useHomepageData(fetchHomepageInstructor, DEFAULT_INSTRUCTOR_CONTENT);
}

export function useHomepageOutcomes() {
  return useHomepageData(fetchHomepageOutcomes, DEFAULT_OUTCOMES_CONTENT);
}

export function useHomepageFreeContent() {
  return useHomepageData(fetchHomepageFreeContent, DEFAULT_FREE_CONTENT);
}

export function useHomepageFaqEntries() {
  return useHomepageData(fetchHomepageFaqEntries, []);
}

export function useHomepageSectionLayout() {
  return useHomepageData(fetchHomepageSectionLayout, DEFAULT_SECTION_LAYOUT);
}

/** The primary diploma's enrollment CTA, priced through the same dual-currency resolver as the course catalog. */
export function usePrimaryDiplomaOffer() {
  const pricingContext = usePricingContext();
  const { courses, isLoading } = useCourseCatalog({ id: PRIMARY_DIPLOMA_COURSE_ID, pageSize: 1, pricingContext });
  const course = courses[0];
  const ctaText = course
    ? formatHomepageCourseCta(course.title, mapCourseToCardProps(course, pricingContext).price)
    : PRIMARY_DIPLOMA_CTA_FALLBACK;

  return { ctaText, coursePath: PRIMARY_DIPLOMA_PATH, isLoading };
}

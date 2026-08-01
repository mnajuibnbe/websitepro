import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CoursesHeader } from '../components/courses/CoursesHeader';
import { SearchSortBar } from '../components/courses/SearchSortBar';
import { FilterSidebar } from '../components/courses/FilterSidebar';
import { CourseGrid } from '../components/courses/CourseGrid';
import { CourseCatalogFilters, EMPTY_CATALOG_FILTERS } from '../lib/courseCatalog';
import { PageContainer } from '../components/layout/PageContainer';
import { useCourseCategories } from '../hooks/useCourseCategories';

export function CoursesListing() {
  const [searchParams] = useSearchParams();
  const priceParam = searchParams.get('price');
  const [filters, setFilters] = useState<CourseCatalogFilters>(() => ({
    ...EMPTY_CATALOG_FILTERS,
    price: priceParam === 'free' || priceParam === 'paid' ? priceParam : 'all',
  }));
  const [resultCount, setResultCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { categories, error: categoriesError } = useCourseCategories();

  useEffect(() => {
    const nextPrice = priceParam === 'free' || priceParam === 'paid' ? priceParam : 'all';
    setFilters((current) => current.price === nextPrice ? current : { ...current, price: nextPrice });
  }, [priceParam]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />

      <main id="main-content" className="flex-grow">
        <PageContainer>
          <CoursesHeader filters={filters} onChange={setFilters} categories={categories} />
          <SearchSortBar filters={filters} onChange={setFilters} resultCount={resultCount} filtersOpen={mobileFiltersOpen} onToggleFilters={() => setMobileFiltersOpen(open => !open)} />

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
            {/* Sidebar (3 columns on desktop) */}
            <div className="lg:col-span-3">
              <FilterSidebar filters={filters} onChange={setFilters} mobileOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} categories={categories} categoriesError={Boolean(categoriesError)} />
            </div>

            {/* Course Grid (9 columns on desktop) */}
            <div className="lg:col-span-9">
              <CourseGrid filters={filters} onFiltersChange={setFilters} onResultCountChange={setResultCount} />
            </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}

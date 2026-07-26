import React, { useState } from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CoursesHeader } from '../components/courses/CoursesHeader';
import { SearchSortBar } from '../components/courses/SearchSortBar';
import { FilterSidebar } from '../components/courses/FilterSidebar';
import { CourseGrid } from '../components/courses/CourseGrid';
import { CourseCatalogFilters, EMPTY_CATALOG_FILTERS } from '../lib/courseCatalog';

export function CoursesListing() {
  const [filters, setFilters] = useState<CourseCatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [resultCount, setResultCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />
      
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <CoursesHeader filters={filters} onChange={setFilters} />
          <SearchSortBar filters={filters} onChange={setFilters} resultCount={resultCount} filtersOpen={mobileFiltersOpen} onToggleFilters={() => setMobileFiltersOpen(open => !open)} />
          
          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
            {/* Sidebar (3 columns on desktop) */}
            <div className="lg:col-span-3">
              <FilterSidebar filters={filters} onChange={setFilters} mobileOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} />
            </div>
            
            {/* Course Grid (9 columns on desktop) */}
            <div className="lg:col-span-9">
              <CourseGrid filters={filters} onFiltersChange={setFilters} onResultCountChange={setResultCount} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

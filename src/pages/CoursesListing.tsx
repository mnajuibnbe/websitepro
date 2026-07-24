import React from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CoursesHeader } from '../components/courses/CoursesHeader';
import { SearchSortBar } from '../components/courses/SearchSortBar';
import { FilterSidebar } from '../components/courses/FilterSidebar';
import { CourseGrid } from '../components/courses/CourseGrid';

export function CoursesListing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />
      
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <CoursesHeader />
          <SearchSortBar />
          
          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
            {/* Sidebar (3 columns on desktop) */}
            <div className="lg:col-span-3">
              <FilterSidebar />
            </div>
            
            {/* Course Grid (9 columns on desktop) */}
            <div className="lg:col-span-9">
              <CourseGrid />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

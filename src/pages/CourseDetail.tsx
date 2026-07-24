import React from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { CourseHero } from '../components/course-detail/CourseHero';
import { EnrollmentCard } from '../components/course-detail/EnrollmentCard';
import { LearningOutcomes } from '../components/course-detail/LearningOutcomes';
import { WhoIsThisFor } from '../components/course-detail/WhoIsThisFor';
import { Requirements } from '../components/course-detail/Requirements';
import { CurriculumAccordion } from '../components/course-detail/CurriculumAccordion';
import { CourseInstructor } from '../components/course-detail/CourseInstructor';
import { CourseReviews } from '../components/course-detail/CourseReviews';

export function CourseDetail() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNavbar />
      
      <main className="flex-grow pt-24 md:pt-32 pb-32 lg:pb-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative items-start">
            
            {/* Content Area (8 columns on Desktop) */}
            <div className="lg:col-span-8 order-1">
              <CourseHero />
              
              {/* Additional content sections */}
              <LearningOutcomes />
              <WhoIsThisFor />
              <Requirements />
              <CurriculumAccordion />
              <CourseInstructor />
              <CourseReviews />
            </div>

            {/* Sidebar Area (4 columns on Desktop) */}
            <div className="lg:col-span-4 order-2">
              <EnrollmentCard />
            </div>
            
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

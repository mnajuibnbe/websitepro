import React from 'react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { HeroSection } from '../components/sections/HeroSection';
import { StatsBar } from '../components/sections/StatsBar';
import { FeaturedCourses } from '../components/sections/FeaturedCourses';
import { WhyChooseUs } from '../components/sections/WhyChooseUs';
import { LearningMethod } from '../components/sections/LearningMethod';
import { InstructorSection } from '../components/sections/InstructorSection';
import { Testimonials } from '../components/sections/Testimonials';
import { FreeContent } from '../components/sections/FreeContent';
import { FinalCTA } from '../components/sections/FinalCTA';
import { Newsletter } from '../components/sections/Newsletter';
import { Footer } from '../components/layout/Footer';

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNavbar />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturedCourses />
        <WhyChooseUs />
        <LearningMethod />
        <InstructorSection />
        <Testimonials />
        <FreeContent />
        <FinalCTA />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

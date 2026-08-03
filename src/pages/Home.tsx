import React from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { StatsBar } from '../components/sections/StatsBar';
import { FeaturedCourses } from '../components/sections/FeaturedCourses';
import { WhyChooseUs } from '../components/sections/WhyChooseUs';
import { LearningMethod } from '../components/sections/LearningMethod';
import { InstructorSection } from '../components/sections/InstructorSection';
import { Testimonials } from '../components/sections/Testimonials';
import { FinalCTA } from '../components/sections/FinalCTA';
import { Newsletter } from '../components/sections/Newsletter';
import { PublicLayout } from '../components/layout/PublicLayout';

export function Home() {
  return (
    <PublicLayout className="bg-white">
      <div>
        <HeroSection />
        <StatsBar />
        <FeaturedCourses />
        <InstructorSection />
        <WhyChooseUs />
        <LearningMethod />
        <Testimonials />
        <FinalCTA />
        <Newsletter />
      </div>
    </PublicLayout>
  );
}

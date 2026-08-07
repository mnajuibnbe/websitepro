import React from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { StatsBar } from '../components/sections/StatsBar';
import { FeaturedCourses } from '../components/sections/FeaturedCourses';
import { WhyChooseUs } from '../components/sections/WhyChooseUs';
import { LearningMethod } from '../components/sections/LearningMethod';
import { InstructorSection } from '../components/sections/InstructorSection';
import { OutcomesSection } from '../components/sections/OutcomesSection';
import { Testimonials } from '../components/sections/Testimonials';
import { FinalCTA } from '../components/sections/FinalCTA';
import { Newsletter } from '../components/sections/Newsletter';
import { PublicLayout } from '../components/layout/PublicLayout';
import { LatestArticles } from '../components/sections/LatestArticles';
import { HomepageFAQ } from '../components/sections/HomepageFAQ';
import { FEATURE_FLAGS } from '../config/featureFlags';

export function Home() {
  return (
    <PublicLayout className="bg-white">
      <div>
        <HeroSection />
        <StatsBar />
        <WhyChooseUs />
        <FeaturedCourses />
        <InstructorSection />
        <LearningMethod />
        <OutcomesSection />
        <Testimonials />
        <LatestArticles />
        <HomepageFAQ />
        <FinalCTA />
        {FEATURE_FLAGS.newsletter && <Newsletter />}
      </div>
    </PublicLayout>
  );
}

import { ComponentType } from 'react';
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
import { FreeContent } from '../components/sections/FreeContent';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useHomepageSectionLayout } from '../hooks/useHomepageMarketing';
import type { HomepageSectionKey } from '../lib/homepageMarketing';

const SECTION_COMPONENTS: Record<HomepageSectionKey, ComponentType> = {
  stats: StatsBar,
  why_choose_us: WhyChooseUs,
  featured_courses: FeaturedCourses,
  instructor: InstructorSection,
  learning_method: LearningMethod,
  outcomes: OutcomesSection,
  testimonials: Testimonials,
  free_content: FreeContent,
  latest_articles: LatestArticles,
  faq: HomepageFAQ,
  final_cta: FinalCTA,
};

export function Home() {
  const { data: sectionKeys } = useHomepageSectionLayout();

  return (
    <PublicLayout className="bg-white">
      <div>
        <HeroSection />
        {sectionKeys.map(key => {
          const Section = SECTION_COMPONENTS[key];
          return Section ? <Section key={key} /> : null;
        })}
        {FEATURE_FLAGS.newsletter && <Newsletter />}
      </div>
    </PublicLayout>
  );
}

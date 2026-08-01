import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';
import { IntroVideoModal } from '../video/IntroVideoModal';

export function FinalCTA() {
  const navigate = useNavigate();
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const closeIntro = useCallback(() => setIsIntroOpen(false), []);
  return (
    <section className="py-20 md:py-32 bg-primary-900 text-white text-center">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
          Ready to Advance Your Cosmeceutical Career?
        </h2>
        <p className="text-lg md:text-xl text-primary-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          Choose an expert-led course and start building practical, evidence-based skills today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="primary" onClick={() => navigate('/courses')} className="text-lg h-14 px-8 bg-accent-500 hover:bg-accent-400 text-primary-900 border-none hover:shadow-lg transition-all duration-300">
            Explore Courses
          </Button>
          <Button variant="secondary" onClick={() => setIsIntroOpen(true)} className="text-lg h-14 px-8 border-primary-600 text-white hover:bg-primary-800 hover:border-primary-500 transition-all duration-300">
            Watch a Free Lesson
          </Button>
        </div>
        </div>
      </PageContainer>
      <IntroVideoModal
        isOpen={isIntroOpen}
        onClose={closeIntro}
        lessonId="229499af-823c-48d1-a4bd-65ec995aaa2e"
        eyebrow="Free course preview"
        title="Introduction to Skin Hyperpigmentation and Its Causes"
        description="Watch a complete preview lesson from Skin and Hair Care Diploma Part 2."
      />
    </section>
  );
}

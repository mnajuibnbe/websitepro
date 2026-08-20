import React from 'react';
import { Button } from '../ui/Button';
import { courseLanguageLabel } from '../../lib/externalProof';

function scrollToPurchaseCard() {
  document.getElementById('enrollment-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function CourseFinalCTA({ hasPreviewMedia, language }: { hasPreviewMedia: boolean; language: string | null }) {
  const languageLabel = courseLanguageLabel(language);
  const trustItems = [languageLabel ? `${languageLabel.replace(' course', '')}-taught` : null, 'Lifetime access', 'Learn at your own pace'].filter(Boolean);

  return (
    <section className="mb-12 md:mb-16 rounded-panel bg-primary-900 px-6 py-10 text-center md:px-10 md:py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to start?</h2>
      <p className="mx-auto mt-3 max-w-xl text-primary-200">Preview a lesson, explore the course content, and enroll when you're ready.</p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="primary" className="w-full sm:w-auto px-8 h-12" onClick={scrollToPurchaseCard}>Enroll now</Button>
        {hasPreviewMedia && <Button variant="secondary" className="w-full sm:w-auto px-8 h-12 !border-white !text-white hover:!bg-white/10" onClick={scrollToPurchaseCard}>Preview a lesson</Button>}
      </div>
      <p className="mt-6 text-sm font-medium text-primary-300">{trustItems.join(' · ')}</p>
    </section>
  );
}

import React from 'react';
import { Languages, FlaskConical, PlayCircle, Gauge } from 'lucide-react';
import { courseLanguageLabel } from '../../lib/externalProof';

export function CourseTrustStrip({ language, hasPreviewMedia }: { language: string | null; hasPreviewMedia: boolean }) {
  const languageLabel = courseLanguageLabel(language);

  const items = [
    languageLabel && {
      icon: Languages,
      title: `Taught in ${languageLabel.replace(' course', '')}`,
      description: 'Learn complex skincare science in your own language.',
    },
    {
      icon: FlaskConical,
      title: 'Practical & evidence-based',
      description: 'Connect science with real ingredients and products used in practice.',
    },
    hasPreviewMedia && {
      icon: PlayCircle,
      title: 'Preview before you buy',
      description: 'Watch real lesson previews before you decide.',
    },
    {
      icon: Gauge,
      title: 'Learn at your own pace',
      description: 'Study anytime, anywhere, on any device.',
    },
  ].filter((item): item is { icon: typeof Languages; title: string; description: string } => Boolean(item));

  return (
    <div className="mb-8 rounded-panel bg-primary-50 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
      {items.map(item => (
        <div key={item.title} className="text-center md:text-left">
          <item.icon className="mx-auto md:mx-0 mb-2 h-6 w-6 text-accent-600" aria-hidden="true" />
          <p className="font-bold text-primary-900">{item.title}</p>
          <p className="mt-1 text-sm text-primary-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

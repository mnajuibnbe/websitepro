import React from 'react';
import { Check } from 'lucide-react';

export function LearningOutcomes() {
  const outcomes = [
    'Explain the scientific principles behind common cosmeceutical ingredients.',
    'Evaluate product formulations using evidence-based criteria.',
    'Recommend appropriate routines for common client needs.',
    'Interpret ingredient lists using International Nomenclature of Cosmetic Ingredients (INCI).',
    'Apply course concepts to practical professional scenarios.',
    'Communicate product guidance clearly and responsibly.'
  ];

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        What You Will Learn
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {outcomes.map((outcome, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-accent-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-accent-600" />
            </div>
            <p className="text-primary-700 leading-relaxed font-medium">
              {outcome}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

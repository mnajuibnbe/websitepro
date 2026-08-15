import React from 'react';
import { Check } from 'lucide-react';
import { Collapsible } from '../ui/Collapsible';

export function LearningOutcomes({ outcomes }: { outcomes: string[] }) {
  const visibleOutcomes = outcomes.map(item => item.trim()).filter(Boolean);

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Learning outcomes
      </h2>
      {visibleOutcomes.length === 0 ? <div className="rounded-xl border border-dashed border-accent-200 bg-accent-50 p-6 text-primary-600">Learning outcomes have not been published for this course yet.</div> : (
        <Collapsible collapsedClassName="max-h-[460px] md:max-h-[220px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {visibleOutcomes.map((outcome, index) => (
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
        </Collapsible>
      )}
    </div>
  );
}

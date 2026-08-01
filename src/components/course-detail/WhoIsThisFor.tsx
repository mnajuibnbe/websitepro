import React from 'react';
import { UserRound } from 'lucide-react';

export function WhoIsThisFor({ audiences }: { audiences: string[] }) {
  const visibleAudiences = audiences.map(item => item.trim()).filter(Boolean);
  if (visibleAudiences.length === 0) return null;

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Who this course is for
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {visibleAudiences.map((audience, index) => {
          return (
            <div key={index} className="bg-primary-50 border border-primary-100 p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-primary-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <UserRound className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <p className="font-bold leading-relaxed text-primary-800">{audience}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

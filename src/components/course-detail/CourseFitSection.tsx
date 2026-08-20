import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function CourseFitSection({ audiences, requirements }: { audiences: string[]; requirements: string[] }) {
  const visibleAudiences = audiences.map(item => item.trim()).filter(Boolean);
  const visibleRequirements = requirements.map(item => item.trim()).filter(Boolean);

  return (
    <section className="mb-12 md:mb-16" aria-labelledby="course-fit-heading">
      <h2 id="course-fit-heading" className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Is this course right for you?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <h3 className="mb-4 font-bold text-accent-700">This course is for</h3>
          {visibleAudiences.length === 0 ? (
            <p className="text-sm text-primary-500">Audience details have not been published for this course yet.</p>
          ) : (
            <ul className="space-y-3 text-primary-700 font-medium">
              {visibleAudiences.map((audience, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-accent-600" aria-hidden="true" />
                  <span>{audience}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-4 font-bold text-accent-700">Before you start</h3>
          {visibleRequirements.length === 0 ? (
            <p className="text-sm text-primary-500">No specific requirements have been published for this course.</p>
          ) : (
            <ul className="space-y-3 text-primary-700 font-medium">
              {visibleRequirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-accent-600" aria-hidden="true" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

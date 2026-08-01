import React from 'react';

export function Requirements({ requirements }: { requirements: string[] }) {
  const visibleRequirements = requirements.map(item => item.trim()).filter(Boolean);
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Requirements
      </h2>
      {visibleRequirements.length === 0 ? <div className="rounded-xl border border-dashed border-primary-300 bg-primary-50 p-6 text-primary-600">No course requirements have been published.</div> : <div className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm">
        <ul className="space-y-3 text-primary-700 font-medium">
          {visibleRequirements.map((requirement, index) => <li key={index} className="flex items-start gap-3"><div className="mt-2 h-2 w-2 flex-none rounded-full bg-accent-500" /><span>{requirement}</span></li>)}
        </ul>
      </div>}
    </div>
  );
}

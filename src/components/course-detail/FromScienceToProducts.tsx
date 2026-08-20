import React from 'react';

const STEPS = [
  { title: 'Understand the science', description: "Learn what's happening in the skin." },
  { title: 'Understand the ingredients', description: 'See why different actives behave differently.' },
  { title: 'Apply it to real products', description: 'Compare formulations and products used in practice.' },
];

export function FromScienceToProducts() {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">From science to real products</h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex-1 text-center sm:text-left">
              <div className="mx-auto sm:mx-0 mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 font-bold text-accent-700">{index + 1}</div>
              <p className="font-bold text-primary-900">{step.title}</p>
              <p className="mt-1 text-sm text-primary-600 leading-relaxed">{step.description}</p>
            </div>
            {index < STEPS.length - 1 && <div className="hidden sm:block w-8 h-px bg-primary-200 mt-4" aria-hidden="true" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

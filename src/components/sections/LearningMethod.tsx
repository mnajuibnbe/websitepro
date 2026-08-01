import React from 'react';
import { Button } from '../ui/Button';
import { PageContainer } from '../layout/PageContainer';

export function LearningMethod() {
  const steps = [
    { id: 1, number: '01', title: 'Learn', description: 'Follow structured, accessible scientific lessons.' },
    { id: 2, number: '02', title: 'Apply', description: 'Work through practical cases from the market.' },
    { id: 3, number: '03', title: 'Assess', description: 'Check your understanding with focused questions.' },
    { id: 4, number: '04', title: 'Understand', description: 'Use detailed explanations to close knowledge gaps.' },
    { id: 5, number: '05', title: 'Retain', description: 'Reinforce key concepts with memory tools.' },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <PageContainer>
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            How Learning Works
          </h2>
          <p className="text-lg text-primary-600">
            A complete method designed to help you understand, retain, and apply what you learn.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative mb-16 md:mb-20">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-primary-100"></div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-row lg:flex-col items-start lg:items-center relative">
                {/* Connecting Line (Mobile/Tablet) */}
                {index !== steps.length - 1 && (
                  <div className="lg:hidden absolute top-12 bottom-[-2rem] right-6 w-0.5 bg-primary-100"></div>
                )}

                {/* Number Indicator */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-accent-600 flex items-center justify-center text-accent-600 font-bold text-lg mb-0 lg:mb-6 z-10 relative">
                  {step.number}
                </div>

                {/* Content */}
                <div className="ms-6 lg:ms-0 lg:text-center mt-2 lg:mt-0 pb-8 lg:pb-0">
                  <h3 className="text-xl font-bold text-primary-900 mb-2">{step.title}</h3>
                  <p className="text-primary-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="secondary" className="px-8">
            Explore Our Learning Method
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

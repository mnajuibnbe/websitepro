import React from 'react';
import { Button } from '../ui/Button';

export function LearningMethod() {
  const steps = [
    { id: 1, number: '01', title: 'تعلّم', description: 'دروس علمية منظمة ومبسطة.' },
    { id: 2, number: '02', title: 'طبّق', description: 'دراسة حالات حقيقية من السوق.' },
    { id: 3, number: '03', title: 'اختبر', description: 'أسئلة لتقييم فهمك للمحتوى.' },
    { id: 4, number: '04', title: 'افهم', description: 'شرح مفصل مع الذكاء الاصطناعي.' },
    { id: 5, number: '05', title: 'تذكّر', description: 'أدوات ربط ذهني لترسيخ المعلومات.' },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            كيف يعمل نظام التعلم؟
          </h2>
          <p className="text-lg text-primary-600">
            منهجية متكاملة لضمان الفهم العميق وتذكر المعلومات وتطبيقها عملياً.
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
            استكشفي منهجية التعلم
          </Button>
        </div>
      </div>
    </section>
  );
}

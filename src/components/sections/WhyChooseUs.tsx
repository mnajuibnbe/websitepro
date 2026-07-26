import React from 'react';
import { Microscope, Layers, Clock, Award } from 'lucide-react';

export function WhyChooseUs() {
  const features = [
    {
      id: 1,
      title: 'Learn More',
      description: 'Save.',
      icon: Microscope,
    },
    {
      id: 2,
      title: 'Learn More',
      description: 'Learn More.',
      icon: Layers,
    },
    {
      id: 3,
      title: 'Learn More',
      description: 'Content.',
      icon: Clock,
    },
    {
      id: 4,
      title: 'Learn More',
      description: 'Review the quiz information and continue when you are ready..',
      icon: Award,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900">
            Learn More TutibaLearn More
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-primary-100 flex flex-col h-full hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-accent-600" />
                </div>
                <h3 className="text-xl font-bold text-primary-900 mb-3">{feature.title}</h3>
                <p className="text-primary-600 flex-grow leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

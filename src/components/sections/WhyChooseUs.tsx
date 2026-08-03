import React from 'react';
import { Microscope, Layers, ScanSearch, Award } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';

export function WhyChooseUs() {
  const features = [
    { id: 1, title: 'From Skin Structure to Product Choice', description: 'Connect the dermis and hypodermis to the claims, delivery limits, and intended action of cosmeceutical products.', icon: Microscope },
    { id: 2, title: 'Hyaluronic Acid in Real Depth', description: 'Compare molecular sizes, intrinsic skin effects, and why formulation differences change product performance.', icon: Layers },
    { id: 3, title: 'Read Products with More Confidence', description: 'Move beyond category labels by evaluating ingredients, target layers, and the evidence behind product positioning.', icon: ScanSearch },
    { id: 4, title: 'A Diploma Path You Can Verify', description: 'See the lesson count, curriculum topics, free preview, assessment path, and EGP price before you enroll.', icon: Award },
  ];

  return (
    <section className="py-16 md:py-24 bg-primary-50">
      <PageContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900">
            What Makes the Curriculum Different?
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
      </PageContainer>
    </section>
  );
}

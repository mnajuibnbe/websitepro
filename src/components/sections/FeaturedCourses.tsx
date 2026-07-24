import React from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';

export function FeaturedCourses() {
  const courses = [
    {
      id: 1,
      title: "دبلومة العناية بالبشرة والشعر",
      category: "Diploma",
      description: "تعلّمي كيف تفهمين المكونات، وتقيمين المنتجات، وتبنين قرارات قائمة على العلم والتطبيق العملي.",
      duration: "80 ساعة",
      lessonsCount: 45,
      price: 199,
      imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "علم تركيبات منتجات التفتيح",
      category: "Skin Care",
      description: "كورس مكثف في دراسة المكونات الفعالة لتفتيح التصبغات وتوحيد لون البشرة وفهم التداخلات الكيميائية.",
      duration: "15 ساعة",
      lessonsCount: 12,
      price: 49,
      imageUrl: "https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "مقارنة بين أنواع الريتينول",
      category: "Specialized",
      description: "دليلك الشامل لتقييم واستخدام مشتقات فيتامين أ في الروتين التجميلي مع الحالات العملية.",
      duration: "5 ساعات",
      lessonsCount: 8,
      price: 29,
      imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            البرامج التعليمية المميزة
          </h2>
          <p className="text-lg text-primary-600">
            اختاري البرنامج الذي يناسب هدفك المهني ومستوى خبرتك.
          </p>
        </div>
        
        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map(course => (
            <CourseCard 
              key={course.id}
              title={course.title}
              category={course.category}
              description={course.description}
              duration={course.duration}
              lessonsCount={course.lessonsCount}
              price={course.price}
              imageUrl={course.imageUrl}
              ctaText="استعرضي الكورس"
              onEnroll={() => window.location.hash = '#/course'}
            />
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => window.location.hash = '#/courses'}>
            عرض جميع الكورسات
          </Button>
        </div>

      </div>
    </section>
  );
}

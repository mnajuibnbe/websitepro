import React, { useState, useEffect } from 'react';
import { CourseCard } from '../ui/CourseCard';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export function FeaturedCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedCourses() {
      try {
        setIsLoading(true);
        // Fetch top 3 active courses as featured
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setCourses(data);
        }
      } catch (err) {
        console.error("Error fetching featured courses", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeaturedCourses();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-white flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
      </section>
    );
  }

  if (courses.length === 0) return null;

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
              category="Course"
              description={course.description}
              duration="TBD"
              lessonsCount={0}
              price={typeof course.price === 'number' ? course.price : parseFloat(course.price || '0')}
              imageUrl={course.thumbnail || "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"}
              ctaText="استعرضي الكورس"
              onEnroll={() => navigate(`/course/${course.id}`)}
            />
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button variant="secondary" className="px-8" onClick={() => navigate('/courses')}>
            عرض جميع الكورسات
          </Button>
        </div>
      </div>
    </section>
  );
}

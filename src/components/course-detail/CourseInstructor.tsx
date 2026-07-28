import React from 'react';
import { Button } from '../ui/Button';
import { Award, BookOpen, GraduationCap } from 'lucide-react';

export function CourseInstructor() {
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        Instructor
      </h2>
      <div className="bg-white border border-primary-200 p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-right">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0 border-4 border-primary-50 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop"
              alt="Dr. Sarah Mitchell"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-primary-900 mb-2">Dr. Sarah Mitchell</h3>
            <p className="text-accent-600 font-bold mb-4">Assigned Instructor</p>
            <p className="text-primary-600 leading-relaxed mb-6 font-medium">
              An experienced educator dedicated to practical, student-centered learning.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">10 courses</span>
                  <span className="text-xs text-primary-500 font-medium">Courses</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">8 years</span>
                  <span className="text-xs text-primary-500 font-medium">Courses</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">1,000+ students</span>
                  <span className="text-xs text-primary-500 font-medium">Courses</span>
                </div>
              </div>
            </div>

            <Button variant="secondary" className="w-full sm:w-auto">
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

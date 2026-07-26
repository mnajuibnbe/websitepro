import React from 'react';
import { Lesson, CourseSection } from '../../types/database.types';
import { Clock, MonitorPlay, FileText } from 'lucide-react';

interface LessonDetailsProps {
  lesson: Lesson;
  section: CourseSection | null;
}

export function LessonDetails({ lesson, section }: LessonDetailsProps) {
  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm text-left mt-6" dir="ltr">
      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-semibold">
        {section && (
          <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-lg">
            {section.title}
          </span>
        )}
        <span className="bg-accent-50 text-accent-700 border border-accent-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          {lesson.type === 'video' ? (
            <>
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Lesson</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              <span>Lesson</span>
            </>
          )}
        </span>
        {lesson.duration && (
          <span className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{lesson.duration}</span>
          </span>
        )}
      </div>

      {/* Lesson Title */}
      <h2 className="text-xl md:text-2xl font-bold text-primary-950 mb-3 leading-snug">
        {lesson.title}
      </h2>

      {/* Description */}
      {lesson.description && (
        <p className="text-primary-600 text-sm md:text-base leading-relaxed mb-4">
          {lesson.description}
        </p>
      )}
    </div>
  );
}

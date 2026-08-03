import React from 'react';
import { ChevronRight, Star, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CourseCatalogItem } from '../../services/courseCatalog.service';
import { getCourseSalesTheme } from '../../domain/courseSalesTheme';
import { CourseTrailer } from './CourseTrailer';

const levelLabel = (level: string | null | undefined) => ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', all_levels: 'All levels' }[level || ''] || level || 'All levels');

export function CourseHero({ course }: { course: CourseCatalogItem }) {
  const theme = getCourseSalesTheme(course.category);
  const CategoryIcon = theme.icon;
  const durationSeconds = Number(course?.total_video_duration_seconds || 0);
  const durationLabel = durationSeconds > 0
    ? `${Math.floor(durationSeconds / 3600) > 0 ? `${Math.floor(durationSeconds / 3600)} hr ` : ''}${Math.ceil((durationSeconds % 3600) / 60)} min video`
    : 'Self-paced learning';
  return (
    <div className={`mb-8 rounded-3xl border-t-4 bg-gradient-to-br ${theme.accentBorder} ${theme.panel} px-5 pb-8 pt-5 shadow-sm lg:mb-12 md:px-8`}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <Link to="/" className="hover:text-accent-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <Link to="/courses" className="hover:text-accent-600 transition-colors">Courses</Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-primary-900 font-bold">{course?.title || 'Course Information'}</span>
      </nav>

      {/* Title & Subtitle */}
      <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
        <CategoryIcon className="h-4 w-4" aria-hidden="true" /> {course.category || 'Professional course'} · {levelLabel(course.level)}
      </span>

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-6 leading-snug">
        {course?.title || 'Course Information - Course Information'}
      </h1>

      <p className="text-lg md:text-xl text-primary-600 mb-8 leading-relaxed max-w-3xl">
        {course?.description || 'Course Information.'}
      </p>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-y-4 gap-x-6 mb-10">
        {course.reviewCount > 0 && <div className="flex items-center gap-2">
          <div className="flex items-center text-warning-500">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className={`w-5 h-5 ${index < Math.round(course.rating) ? 'fill-current' : ''}`} />
            ))}
          </div>
          <span className="font-bold text-primary-900">{course.rating.toFixed(1)}</span>
          <span className="text-primary-500 underline decoration-primary-300">({course.reviewCount} reviews)</span>
        </div>}

        {course.reviewCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary-300 hidden sm:block"></div>}

        <div className="flex items-center gap-2 text-primary-700 font-medium">
           <Clock className="w-5 h-5 text-primary-400" />
           <span>{durationLabel}</span>
        </div>

        <div className="w-1.5 h-1.5 rounded-full bg-primary-300 hidden sm:block"></div>

        <div className="flex items-center gap-2 text-primary-700 font-medium">
           <Award className="w-5 h-5 text-primary-400" />
           <span>{levelLabel(course.level)}</span>
        </div>
      </div>

      <CourseTrailer courseId={course.id} title={course.title} trailerUrl={course.trailer_video} poster={course.cover_image || course.thumbnail} />
    </div>
  );
}

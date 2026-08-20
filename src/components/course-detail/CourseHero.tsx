import React from 'react';
import { ChevronRight, Star, Clock, Award, Languages, Infinity as InfinityIcon, PlayCircle, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CourseCatalogItem } from '../../services/courseCatalog.service';
import { formatCourseVideoLength } from '../../lib/courseDuration';
import { courseLanguageLabel, resolveExternalProof } from '../../lib/externalProof';
import { CourseTrustStrip } from './CourseTrustStrip';

const levelLabel = (level: string | null | undefined) => ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', all_levels: 'All levels' }[level || ''] || level || 'All levels');

function Pill({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700">
      <Icon className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
      {children}
    </span>
  );
}

export function CourseHero({ course, hasPreviewMedia }: { course: CourseCatalogItem; hasPreviewMedia: boolean }) {
  const durationLabel = formatCourseVideoLength(Number(course?.total_video_duration_seconds || 0));
  const languageLabel = courseLanguageLabel(course.language);
  const externalProof = resolveExternalProof(course);

  return (
    <div className="mb-8 lg:mb-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <Link to="/courses" className="hover:text-accent-600 transition-colors">Courses</Link>
        {course.category && <>
          <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{course.category}</span>
        </>}
        <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-primary-900 font-bold">{course?.title || 'Course Information'}</span>
      </nav>

      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-800">
        {course.category || 'Professional course'}{languageLabel ? ` · ${languageLabel.toUpperCase()}` : ''}
      </span>

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 leading-snug">
        {course?.title || 'Course Information'}
      </h1>

      {course?.short_description ? (
        <p className="text-lg md:text-xl text-primary-600 mb-5 leading-relaxed max-w-3xl">{course.short_description}</p>
      ) : null}

      {/* Real Tutiba course meta */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mb-3">
        <div className="flex items-center gap-2 text-primary-700 font-medium">
          <Clock className="w-5 h-5 text-primary-400" aria-hidden="true" />
          <span>{durationLabel}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-primary-300 hidden sm:block" aria-hidden="true"></div>
        <div className="flex items-center gap-2 text-primary-700 font-medium">
          <Award className="w-5 h-5 text-primary-400" aria-hidden="true" />
          <span>{levelLabel(course.level)}</span>
        </div>
      </div>

      {/* Verified external proof, clearly attributed -- never presented as a native Tutiba stat */}
      {externalProof && (
        <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-primary-600">
          <span className="flex items-center text-warning-500">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className={`w-4 h-4 ${index < Math.round(externalProof.rating) ? 'fill-current' : ''}`} aria-hidden="true" />
            ))}
          </span>
          <span className="font-bold text-primary-900">{externalProof.rating.toFixed(1)}/5</span>
          {externalProof.ratingCount != null && <span>· {externalProof.ratingCount} ratings</span>}
          {externalProof.studentsCount != null && <span>· {externalProof.studentsCount.toLocaleString('en-US')} learners</span>}
          <span>on {externalProof.sourceUrl ? <a href={externalProof.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-accent-700 underline decoration-accent-300 hover:text-accent-800">{externalProof.source}</a> : <span className="font-bold">{externalProof.source}</span>}</span>
        </p>
      )}

      {/* Quick trust pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {languageLabel && <Pill icon={Languages}>{languageLabel.replace(' course', '')}</Pill>}
        <Pill icon={InfinityIcon}>Lifetime access</Pill>
        {hasPreviewMedia && <Pill icon={PlayCircle}>Preview before you enroll</Pill>}
        <Pill icon={Gauge}>Learn at your own pace</Pill>
      </div>

      <CourseTrustStrip language={course.language} hasPreviewMedia={hasPreviewMedia} />
    </div>
  );
}

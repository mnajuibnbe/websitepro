import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Trophy, Sparkles } from 'lucide-react';
import type { ContinueLearningTarget } from '../../lib/courseProgress';

interface ContinueLearningCardProps {
  target: ContinueLearningTarget;
}

export function ContinueLearningCard({ target }: ContinueLearningCardProps) {
  const navigate = useNavigate();

  if (target.status === 'no_enrollments') {
    return null;
  }

  if (target.status === 'not_started') {
    const resumeHref = target.lessonId ? `/learn/${target.course.id}/lesson/${target.lessonId}` : `/learn/${target.course.id}`;
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent-50 rounded-br-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-between">
          <div className="flex-grow w-full">
            <div className="flex items-center gap-2 text-sm font-bold text-accent-600 mb-3">
              <Sparkles className="w-4 h-4" />
              Ready to start
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">{target.course.title}</h2>
            <p className="text-primary-600 font-medium">
              {target.lessonTitle ? (
                <>
                  First lesson: <strong className="text-primary-800">{target.lessonTitle}</strong>
                </>
              ) : (
                'This course has no published lessons yet.'
              )}
            </p>
          </div>
          <div className="w-full md:w-auto flex-shrink-0">
            <button
              onClick={() => navigate(resumeHref)}
              disabled={!target.lessonId}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md shadow-accent-600/20 hover:bg-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              <PlayCircle className="w-6 h-6" />
              <span>Start course</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (target.status === 'all_completed') {
    return (
      <div className="bg-white border border-success-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-32 h-32 bg-success-50 rounded-br-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-between">
          <div className="flex-grow w-full">
            <div className="flex items-center gap-2 text-sm font-bold text-success-600 mb-3">
              <Trophy className="w-4 h-4" />
              All caught up
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">You&apos;ve completed {target.course.title}</h2>
            <p className="text-primary-600 font-medium">
              {target.completedLessons} of {target.totalLessons} lessons complete — nice work.
            </p>
          </div>
          <div className="w-full md:w-auto flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/learn/${target.course.id}`)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-100 text-primary-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-primary-200 transition-all duration-300"
            >
              Review course
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md shadow-accent-600/20 hover:bg-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Explore more courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // target.status === 'in_progress'
  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent-50 rounded-br-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-between">

        {/* Content */}
        <div className="flex-grow w-full">
          <div className="flex items-center gap-2 text-sm font-bold text-accent-600 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
            In Progress
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">
            {target.course.title}
          </h2>
          <p className="text-primary-600 font-medium mb-6">
            Lesson: <strong className="text-primary-800">{target.lessonTitle}</strong>
          </p>

          {/* Progress */}
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-primary-900">
                {target.completedLessons} of {target.totalLessons} lessons
              </span>
              <span className="text-accent-600">{target.percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-primary-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 rounded-full relative transition-all duration-1000" style={{ width: `${target.percentage}%` }}>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full md:w-auto flex-shrink-0">
          <button
            onClick={() => navigate(`/learn/${target.course.id}/lesson/${target.lessonId}`)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md shadow-accent-600/20 hover:bg-accent-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <PlayCircle className="w-6 h-6" />
            <span>Continue Learning</span>
          </button>
        </div>

      </div>
    </div>
  );
}

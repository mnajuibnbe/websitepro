import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../layout/PageContainer';

interface CourseLearningHeaderProps {
  courseTitle: string;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  onToggleMobileSidebar: () => void;
}

export function CourseLearningHeader({
  courseTitle,
  completedCount,
  totalCount,
  progressPercentage,
  onToggleMobileSidebar,
}: CourseLearningHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-primary-200 sticky top-0 z-30 shadow-xs" dir="ltr">
      <PageContainer className="flex items-center justify-between gap-4 py-3.5">
        {/* Right side: Back button & Course title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/my-courses')}
            className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-xl transition-colors flex-shrink-0 min-w-11 min-h-11 flex items-center justify-center"
            title="Back to my courses"
            aria-label="Back to my courses"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-primary-900 truncate max-w-xs sm:max-w-md lg:max-w-xl">
              {courseTitle}
            </h1>
            <p className="text-xs text-primary-500 font-medium hidden sm:block">
              {completedCount} of {totalCount} lessons complete — {progressPercentage}%
            </p>
          </div>
        </div>

        {/* Left side: Progress bar & Mobile toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden md:flex flex-col items-end gap-1 min-w-[140px]">
            <span className="text-xs font-bold text-primary-700">
              Course progress: {progressPercentage}%
            </span>
            <div className="w-36 h-2 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Open course curriculum"
            aria-haspopup="dialog"
            className="lg:hidden flex items-center gap-2 bg-primary-100 hover:bg-primary-200 text-primary-900 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors min-h-11"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden min-[360px]:inline">Curriculum</span>
          </button>
        </div>
      </PageContainer>
    </header>
  );
}

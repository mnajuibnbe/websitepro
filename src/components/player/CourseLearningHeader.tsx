import React from 'react';
import { ArrowRight, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <header className="bg-white border-b border-primary-200 sticky top-0 z-30 shadow-xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Right side: Back button & Course title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/my-courses')}
            className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-xl transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="العودة لكورساتي"
            aria-label="العودة لكورساتي"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-primary-900 truncate max-w-xs sm:max-w-md lg:max-w-xl">
              {courseTitle}
            </h1>
            <p className="text-xs text-primary-500 font-medium hidden sm:block">
              {completedCount} من {totalCount} دروس مكتملة — {progressPercentage}%
            </p>
          </div>
        </div>

        {/* Left side: Progress bar & Mobile toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden md:flex flex-col items-end gap-1 min-w-[140px]">
            <span className="text-xs font-bold text-primary-700">
              التقدم: {progressPercentage}%
            </span>
            <div className="w-36 h-2 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
          </div>

          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden flex items-center gap-2 bg-primary-100 hover:bg-primary-200 text-primary-900 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors min-h-[44px]"
          >
            <Menu className="w-4 h-4" />
            <span>محتوى الكورس</span>
          </button>
        </div>
      </div>
    </header>
  );
}

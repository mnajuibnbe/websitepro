import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Award } from 'lucide-react';
import { Lesson } from '../../types/database.types';

interface LessonNavigationProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  isCurrentCompleted: boolean;
  isCompleting: boolean;
  onNavigate: (lesson: Lesson) => void;
  onCompleteAndContinue: () => void;
}

export function LessonNavigation({
  prevLesson,
  nextLesson,
  isCurrentCompleted,
  isCompleting,
  onNavigate,
  onCompleteAndContinue,
}: LessonNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-primary-200 mt-6" dir="rtl">
      {/* Right side in RTL: Previous Lesson */}
      <button
        onClick={() => prevLesson && onNavigate(prevLesson)}
        disabled={!prevLesson}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-[48px] ${
          prevLesson
            ? 'bg-white border border-primary-200 text-primary-800 hover:bg-primary-50 hover:border-primary-300'
            : 'bg-primary-50 border border-primary-100 text-primary-300 cursor-not-allowed opacity-60'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
        <span>الدرس السابق</span>
      </button>

      {/* Center: Mark Complete and Continue */}
      <button
        onClick={onCompleteAndContinue}
        disabled={isCompleting}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xs min-h-[48px] ${
          isCurrentCompleted
            ? 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100'
            : 'bg-accent-600 hover:bg-accent-700 text-white'
        }`}
      >
        {isCompleting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isCurrentCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-success-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
        <span>
          {isCompleting
            ? 'جاري الحفظ...'
            : isCurrentCompleted
            ? 'تم إكمال الدرس (مكتمل)'
            : 'إكمال الدرس والمتابعة'}
        </span>
      </button>

      {/* Left side in RTL: Next Lesson */}
      <button
        onClick={() => nextLesson && onNavigate(nextLesson)}
        disabled={!nextLesson}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-[48px] ${
          nextLesson
            ? 'bg-primary-900 hover:bg-primary-800 text-white shadow-xs'
            : 'bg-primary-50 border border-primary-100 text-primary-300 cursor-not-allowed opacity-60'
        }`}
      >
        <span>الدرس التالي</span>
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

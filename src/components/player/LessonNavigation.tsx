import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { Lesson } from '../../types/database.types';

interface LessonNavigationProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  currentLessonType?: string;
  isCurrentCompleted: boolean;
  isCompleting: boolean;
  onNavigate: (lesson: Lesson) => void;
  onCompleteAndContinue: () => void;
}

export function LessonNavigation({
  prevLesson,
  nextLesson,
  currentLessonType,
  isCurrentCompleted,
  isCompleting,
  onNavigate,
  onCompleteAndContinue,
}: LessonNavigationProps) {
  const isQuiz = currentLessonType === 'quiz';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-primary-200 mt-6" dir="ltr">
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
        <span>Previous</span>
      </button>

      {/* Center: Completion Status / Action */}
      {isQuiz ? (
        <div className="w-full sm:w-auto flex items-center justify-center">
          {isCurrentCompleted ? (
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-success-50 text-success-800 border border-success-200 font-bold text-sm min-h-[48px]">
              <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
              <span>Quiz (Completed)</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold text-sm min-h-[48px]">
              <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>Review the quiz information and continue when you are ready.</span>
            </div>
          )}
        </div>
      ) : isCurrentCompleted ? (
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success-50 text-success-800 border border-success-200 font-bold text-sm min-h-[48px]">
            <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
            <span>Lesson</span>
          </div>

          {nextLesson && (
            <button
              onClick={() => onNavigate(nextLesson)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm transition-all shadow-xs min-h-[48px]"
            >
              <span>Next</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onCompleteAndContinue}
          disabled={isCompleting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xs min-h-[48px] bg-accent-600 hover:bg-accent-700 text-white"
        >
          {isCompleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span>
            {isCompleting
              ? 'Saving...'
              : nextLesson
              ? 'Lesson'
              : 'Lesson'}
          </span>
        </button>
      )}

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
        <span>Next</span>
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}


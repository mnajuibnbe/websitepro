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
    <nav aria-label="Lesson navigation" className="grid grid-cols-1 gap-3 border-t border-primary-200 pt-6 mt-6 sm:grid-cols-3 sm:items-center" dir="ltr">
      <button
        type="button"
        onClick={() => prevLesson && onNavigate(prevLesson)}
        disabled={!prevLesson}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-12 ${
          prevLesson
            ? 'bg-white border border-primary-200 text-primary-800 hover:bg-primary-50 hover:border-primary-300'
            : 'bg-primary-50 border border-primary-100 text-primary-300 cursor-not-allowed opacity-60'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous lesson</span>
      </button>

      {/* Center: Completion Status / Action */}
      {isQuiz ? (
        <div className="w-full sm:w-auto flex items-center justify-center">
          {isCurrentCompleted ? (
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-success-50 text-success-800 border border-success-200 font-bold text-sm min-h-12">
              <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
              <span>Quiz complete</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-warning-50 text-warning-900 border border-warning-200 font-bold text-sm min-h-12">
              <HelpCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
              <span>Complete the quiz to continue</span>
            </div>
          )}
        </div>
      ) : isCurrentCompleted ? (
        <div className="w-full flex items-center justify-center">
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success-50 text-success-800 border border-success-200 font-bold text-sm min-h-12">
            <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
            <span>Lesson complete</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCompleteAndContinue}
          disabled={isCompleting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xs min-h-12 bg-accent-600 hover:bg-accent-700 text-white"
        >
          {isCompleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span>
            {isCompleting
              ? 'Saving completion…'
              : nextLesson
              ? 'Mark complete & continue'
              : 'Mark lesson complete'}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => nextLesson && onNavigate(nextLesson)}
        disabled={!nextLesson}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-12 ${
          nextLesson
            ? 'bg-primary-900 hover:bg-primary-800 text-white shadow-xs'
            : 'bg-primary-50 border border-primary-100 text-primary-300 cursor-not-allowed opacity-60'
        }`}
      >
        <span>{nextLesson ? 'Next lesson' : 'Final lesson'}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

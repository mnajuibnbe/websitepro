import React from 'react';
import { Button } from '../ui/Button';
import { Award, RefreshCcw, BookOpen, ChevronLeft } from 'lucide-react';

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  passMark: number;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResult({ score, totalQuestions, passMark, onRetry, onContinue }: QuizResultProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassed = percentage >= passMark;

  return (
    <div className="max-w-2xl mx-auto bg-white border border-primary-200 rounded-2xl p-8 md:p-12 shadow-sm text-center">

      {/* Result Graphic */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            className="stroke-primary-100"
            strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            className={`transition-all duration-1000 ease-out motion-reduce:transition-none motion-reduce:duration-0 ${isPassed ? 'stroke-success-500' : 'stroke-danger-500'}`}
            strokeWidth="10"
            strokeDasharray={`${(percentage / 100) * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${isPassed ? 'text-success-600' : 'text-danger-600'}`}>
            {percentage}%
          </span>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">
        {isPassed ? 'Congratulations! Quiz' : 'Quiz'}
      </h1>
      <p className="text-lg text-primary-600 mb-8 leading-relaxed">
        Details <strong className="text-primary-900">{score}</strong> Details <strong className="text-primary-900">{totalQuestions}</strong> Details.
        {isPassed
          ? ' The requested information could not be loaded. Please try again.'
          : ' Details.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {isPassed ? (
          <>
            <Button
              variant="primary"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-success-600 hover:bg-success-500 border-none shadow-lg shadow-success-600/20"
              onClick={onContinue}
              icon={<ChevronLeft className="w-5 h-5" />} // Left pointing arrow in RTL
            >
              Continue Learning
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold"
              onClick={onRetry}
            >
              Details
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold"
              onClick={onRetry}
              icon={<RefreshCcw className="w-5 h-5" />}
            >
              Retry Quiz
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold"
              icon={<BookOpen className="w-5 h-5" />}
            >
              Lesson
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

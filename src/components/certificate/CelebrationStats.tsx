import React from 'react';
import { CheckCircle2, PlayCircle, Clock, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';

interface CelebrationStatsProps {
  onNext: () => void;
}

export function CelebrationStats({ onNext }: CelebrationStatsProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white border border-primary-200 rounded-2xl p-8 md:p-12 shadow-sm text-center">
      <div className="w-24 h-24 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Trophy className="w-12 h-12 text-success-600" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4 leading-snug">Congratulations! <br className="sm:hidden" />Course</h1>
      <p className="text-lg text-primary-600 mb-10 leading-relaxed">
        Learn More. Learn More.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-primary-50 p-6 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-6 h-6 text-accent-600" />
            <span className="text-3xl font-bold text-primary-900">42</span>
          </div>
          <span className="text-sm font-medium text-primary-500">Completed</span>
        </div>
        <div className="bg-primary-50 p-6 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-success-600" />
            <span className="text-3xl font-bold text-primary-900">5</span>
          </div>
          <span className="text-sm font-medium text-primary-500">Quiz</span>
        </div>
        <div className="bg-primary-50 p-6 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-info-600" />
            <span className="text-3xl font-bold text-primary-900">45</span>
          </div>
          <span className="text-sm font-medium text-primary-500">Hour</span>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full sm:w-auto h-14 px-12 text-lg font-bold"
        onClick={onNext}
      >
        Certificate
      </Button>
    </div>
  );
}

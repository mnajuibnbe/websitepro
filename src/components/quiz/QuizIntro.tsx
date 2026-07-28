import React from 'react';
import { Button } from '../ui/Button';
import { ClipboardList, Award, AlertCircle, PlayCircle } from 'lucide-react';

interface QuizIntroProps {
  onStart: () => void;
  title: string;
  description: string;
  questionsCount: number;
  passMark: number;
  attemptsLeft: number;
}

export function QuizIntro({ onStart, title, description, questionsCount, passMark, attemptsLeft }: QuizIntroProps) {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-primary-200 rounded-2xl p-8 md:p-12 shadow-sm text-center">
      <div className="w-20 h-20 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ClipboardList className="w-10 h-10 text-accent-600" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">{title}</h1>
      <p className="text-lg text-primary-600 mb-8 leading-relaxed">
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-primary-50 p-4 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <span className="text-3xl font-bold text-primary-900 mb-1">{questionsCount}</span>
          <span className="text-sm font-medium text-primary-500">Questions</span>
        </div>
        <div className="bg-primary-50 p-4 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <div className="flex items-center gap-1 mb-1">
            <Award className="w-5 h-5 text-warning-500" />
            <span className="text-3xl font-bold text-primary-900">{passMark}%</span>
          </div>
          <span className="text-sm font-medium text-primary-500">Success</span>
        </div>
        <div className="bg-primary-50 p-4 rounded-xl flex flex-col items-center justify-center border border-primary-100">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-5 h-5 text-info-500" />
            <span className="text-3xl font-bold text-primary-900">{attemptsLeft}</span>
          </div>
          <span className="text-sm font-medium text-primary-500">Attempts Remaining</span>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full sm:w-auto h-14 px-12 text-lg font-bold"
        onClick={onStart}
        icon={<PlayCircle className="w-6 h-6" />}
      >
        Start Quiz
      </Button>
    </div>
  );
}

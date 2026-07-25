import React from 'react';
import { QuizLessonRenderer } from './QuizLessonRenderer';

interface QuizLessonPlaceholderProps {
  title: string;
  lessonId?: string;
  courseId?: string;
  onQuizCompleted?: () => void;
}

export function QuizLessonPlaceholder({
  title,
  lessonId,
  courseId = '',
  onQuizCompleted,
}: QuizLessonPlaceholderProps) {
  if (lessonId) {
    return (
      <QuizLessonRenderer
        lessonId={lessonId}
        courseId={courseId}
        quizTitle={title}
        onQuizCompleted={onQuizCompleted}
      />
    );
  }

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-10 shadow-sm text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-primary-900 mb-3">{title || 'اختبار الدرس'}</h2>
    </div>
  );
}


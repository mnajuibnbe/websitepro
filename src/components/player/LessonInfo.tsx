import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, ChevronLeft, ArrowRight } from 'lucide-react';
import { saveProgress } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function LessonInfo() {
  const { token } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example lesson ID
  const lessonId = 'lesson_101';

  const handleComplete = async () => {
    if (isCompleted) {
      setIsCompleted(false);
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      if (!token) throw new Error('Unauthenticated');
      // Simulate saving progress to 100%
      const success = await saveProgress(lessonId, 100, token);
      if (success) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
      setError('Unable to save your notes. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="py-6 border-b border-primary-200 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-2">
          <span>Section 2: Skin Physiology</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 leading-snug">
          Understanding the skin barrier and its essential functions
        </h1>
        {error && (
          <p className="text-danger-600 text-sm mt-2 font-medium">{error}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
        <Button
          variant={isCompleted ? 'secondary' : 'primary'}
          className={`w-full sm:w-auto h-12 px-6 font-bold flex items-center justify-center gap-2 transition-all ${
            isCompleted ? 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100 hover:border-success-300' : ''
          }`}
          onClick={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <span>Updating Notes...</span>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-success-600" />
              <span>Completed</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Lesson</span>
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto h-12 px-6 font-bold flex items-center justify-center gap-2"
        >
          <span>Next</span>
          <ChevronLeft className="w-4 h-4" /> {/* In RTL, next points left */}
        </Button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { AIExplanation } from './AIExplanation';
import { MemoryCoach } from './MemoryCoach';
import { WrongAnswersAction } from './WrongAnswers';

export interface QuestionData {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  aiExplanation?: {
    scientific: string;
    practical: string;
  };
  memoryCoach?: {
    type: string;
    content: string;
  };
}

interface QuizQuestionProps {
  questionData: QuestionData;
  currentIndex: number;
  totalQuestions: number;
  onNext: (isCorrect: boolean) => void;
}

export function QuizQuestion({ questionData, currentIndex, totalQuestions, onNext }: QuizQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const progressPercentage = ((currentIndex) / totalQuestions) * 100;
  const isCorrect = selectedIndex === questionData.correctIndex;

  const handleCheck = () => {
    if (selectedIndex !== null) {
      setIsChecked(true);
    }
  };

  const handleNext = () => {
    onNext(isCorrect);
    setSelectedIndex(null);
    setIsChecked(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 sm:pb-0">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-bold text-primary-500 mb-2">
          <span>Question {currentIndex + 1} Learn More {totalQuestions}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-8 leading-snug">
          {questionData.question}
        </h2>

        <div className="space-y-4 mb-8">
          {questionData.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            let optionStyles = 'border-primary-200 bg-white hover:border-accent-400 hover:bg-accent-50';

            if (isChecked) {
              if (index === questionData.correctIndex) {
                optionStyles = 'border-success-500 bg-success-50 ring-1 ring-success-500';
              } else if (isSelected) {
                optionStyles = 'border-danger-500 bg-danger-50 ring-1 ring-danger-500';
              } else {
                optionStyles = 'border-primary-200 bg-white opacity-50';
              }
            } else if (isSelected) {
              optionStyles = 'border-accent-600 bg-accent-50 ring-1 ring-accent-600';
            }

            return (
              <label
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${optionStyles} ${isChecked ? 'pointer-events-none' : ''}`}
              >
                <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${
                  isChecked && index === questionData.correctIndex ? 'border-success-500 bg-success-500' :
                  isChecked && isSelected ? 'border-danger-500 bg-danger-500' :
                  isSelected ? 'border-accent-600 bg-accent-600' : 'border-primary-300'
                }`}>
                  {isChecked && index === questionData.correctIndex && <CheckCircle2 className="w-4 h-4 text-white absolute" />}
                  {isChecked && isSelected && index !== questionData.correctIndex && <XCircle className="w-4 h-4 text-white absolute" />}
                  {!isChecked && isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                  <input
                    type="radio"
                    name="quiz-option"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => setSelectedIndex(index)}
                    disabled={isChecked}
                  />
                </div>
                <span className={`font-medium ${isChecked && index === questionData.correctIndex ? 'text-success-900' : isChecked && isSelected ? 'text-danger-900' : 'text-primary-800'}`}>
                  {option}
                </span>
              </label>
            );
          })}
        </div>

        {/* Feedback Section */}
        {isChecked && (
          <div className="space-y-4">
            <AIExplanation
              isCorrect={isCorrect}
              briefExplanation={questionData.explanation}
              scientificExplanation={questionData.aiExplanation?.scientific}
              practicalExample={questionData.aiExplanation?.practical}
            />

            {questionData.memoryCoach && (
              <MemoryCoach
                type={questionData.memoryCoach.type}
                content={questionData.memoryCoach.content}
              />
            )}

            {!isCorrect && (
              <div className="flex justify-start pt-2">
                <WrongAnswersAction />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white sm:bg-transparent border-t border-primary-200 sm:pt-6 flex justify-end z-20 shadow-[0_-8px_16px_rgba(0,0,0,0.05)] sm:shadow-none">
        {!isChecked ? (
          <Button
            variant="primary"
            className="h-14 sm:h-12 w-full sm:w-auto px-8 font-bold text-lg sm:text-base"
            onClick={handleCheck}
            disabled={selectedIndex === null}
          >
            Answer
          </Button>
        ) : (
          <Button
            variant="primary"
            className="h-14 sm:h-12 w-full sm:w-auto px-8 font-bold text-lg sm:text-base"
            onClick={handleNext}
            icon={<ArrowLeft className="w-5 h-5" />} // Points left in RTL
          >
            {currentIndex === totalQuestions - 1 ? 'Quiz' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { QuizIntro } from '../components/quiz/QuizIntro';
import { QuizQuestion, QuestionData } from '../components/quiz/QuizQuestion';
import { QuizResult } from '../components/quiz/QuizResult';

const mockQuestions: QuestionData[] = [
  {
    id: 1,
    question: "Next (Humectants)Learn More",
    options: ["Learn More", "Learn More", "Learn More", "Learn More"],
    correctIndex: 0,
    explanation: "Learn More.",
    aiExplanation: {
      scientific: "Learn More Humectants Learn More (Hydrophilic) Learn More (-OH) Learn More.",
      practical: "Learn More The Ordinary Learn More (Damp skin)."
    },
    memoryCoach: {
      type: "Link",
      content: "Learn More (Learn More) Learn More."
    }
  },
  {
    id: 2,
    question: "Sort",
    options: [
      "Learn More",
      "Learn More",
      "Learn More",
      "Learn More"
    ],
    correctIndex: 1,
    explanation: "Learn More.",
    aiExplanation: {
      scientific: "Learn More (Learn More)Learn More.",
      practical: "Learn More (AHA/BHA) Learn More."
    },
    memoryCoach: {
      type: "Learn More",
      content: "Learn More (Learn More.Learn More.Learn More): Learn More (Learn More) -> Learn More (Learn More) -> Learn More (Learn More)."
    }
  },
  {
    id: 3,
    question: "Learn More (Preservatives) Learn More",
    options: [
      "Learn More 100%",
      "Learn More (Aqueous)",
      "Learn More (Solid bars)",
      "Learn More"
    ],
    correctIndex: 1,
    explanation: "Learn More.",
    aiExplanation: {
      scientific: "Learn More (Water Activity - Aw) Minute. Learn More.",
      practical: "Learn More C Learn More 100% Learn More (Learn More)."
    },
    memoryCoach: {
      type: "Learn More",
      content: "Learn More (Learn More) Learn More (Learn More) Learn More. Learn More (Learn More)Learn More (Learn More)."
    }
  }
];

export function QuizPage() {
  const navigate = useNavigate();

  const [quizState, setQuizState] = useState<'intro' | 'question' | 'result'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  const handleStart = () => {
    setQuizState('question');
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  const handleNextQuestion = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizState('result');
    }
  };

  const handleRetry = () => {
    setQuizState('intro');
  };

  const handleContinue = () => {
    navigate('/my-courses');
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Focused Header */}
      <header className="h-16 bg-white border-b border-primary-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <Link to="/my-courses" className="flex items-center gap-2 text-primary-600 hover:text-accent-600 transition-colors group min-h-[44px]">
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:transform-none" />
          <span className="font-bold text-sm hidden sm:block">Quiz</span>
        </Link>
        <div className="font-bold text-primary-900 text-sm md:text-base">
          Learn More
        </div>
        <button onClick={() => navigate('/my-courses')} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-primary-50 text-primary-500 hover:text-primary-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Quiz Area */}
      <main className="flex-grow py-12 px-4 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">

          {quizState === 'intro' && (
            <QuizIntro
              title="Section: Learn More"
              description="Review the quiz information and continue when you are ready.. Learn More."
              questionsCount={mockQuestions.length}
              passMark={80}
              attemptsLeft={3}
              onStart={handleStart}
            />
          )}

          {quizState === 'question' && (
            <QuizQuestion
              questionData={mockQuestions[currentQuestionIndex]}
              currentIndex={currentQuestionIndex}
              totalQuestions={mockQuestions.length}
              onNext={handleNextQuestion}
            />
          )}

          {quizState === 'result' && (
            <QuizResult
              score={score}
              totalQuestions={mockQuestions.length}
              passMark={80}
              onRetry={handleRetry}
              onContinue={handleContinue}
            />
          )}

        </div>
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { QuizIntro } from '../components/quiz/QuizIntro';
import { QuizQuestion, QuestionData } from '../components/quiz/QuizQuestion';
import { QuizResult } from '../components/quiz/QuizResult';

const mockQuestions: QuestionData[] = [
  {
    id: 1,
    question: "Which ingredient is classified as a humectant?",
    options: ["Hyaluronic acid", "Jojoba oil", "Shea butter", "Silicone"],
    correctIndex: 0,
    explanation: "Hyaluronic acid attracts and retains water, while oils primarily act as emollients.",
    aiExplanation: {
      scientific: "Humectants are hydrophilic molecules that bind water and help increase hydration in the stratum corneum.",
      practical: "Apply a hyaluronic acid serum to slightly damp skin, then follow with a moisturizer to reduce water loss."
    },
    memoryCoach: { type: "Memory Aid", content: "Think of hyaluronic acid as a sponge that attracts water to the skin's surface." }
  },
  {
    id: 2,
    question: "What is the correct order of these epidermal layers from outermost to deepest?",
    options: [
      "Basal, spinous, corneal",
      "Corneal, spinous, basal",
      "Spinous, corneal, basal",
      "Corneal, basal, spinous"
    ],
    correctIndex: 1,
    explanation: "The stratum corneum is the outermost layer, while the basal layer is the deepest of these layers.",
    aiExplanation: {
      scientific: "Keratinocytes originate in the basal layer and move upward through the spinous layers before forming the protective stratum corneum.",
      practical: "Most cosmetic exfoliants act on the superficial stratum corneum rather than the deeper living layers."
    },
    memoryCoach: { type: "Mnemonic", content: "Remember the outside-in order: corneal, spinous, basal." }
  },
  {
    id: 3,
    question: "When are antimicrobial preservatives generally required in a cosmetic formula?",
    options: [
      "In products made entirely from oils",
      "In products that contain water",
      "Only in solid cleansing bars",
      "In every cosmetic product without exception"
    ],
    correctIndex: 1,
    explanation: "Water-containing formulas can support microbial growth and therefore generally require an appropriate preservation system.",
    aiExplanation: {
      scientific: "Sufficient water activity can support bacteria, yeast, and mold. A suitable preservative system helps protect product safety and stability.",
      practical: "A water-based face cream typically needs antimicrobial preservation, while a fully anhydrous oil may have different stability requirements."
    },
    memoryCoach: { type: "Memory Aid", content: "Where there is available water, assess the need for microbial protection." }
  }
];

function loadSavedQuiz() {
  try { return JSON.parse(sessionStorage.getItem('tutiba:practice-quiz') || 'null'); }
  catch { sessionStorage.removeItem('tutiba:practice-quiz'); return null; }
}

export function QuizPage() {
  const navigate = useNavigate();
  const [initial] = useState(loadSavedQuiz);
  const [quizState, setQuizState] = useState<'intro' | 'question' | 'result'>(initial?.quizState || 'intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initial?.currentQuestionIndex || 0);
  const [score, setScore] = useState(initial?.score || 0);

  useEffect(() => {
    sessionStorage.setItem('tutiba:practice-quiz', JSON.stringify({ quizState, currentQuestionIndex, score }));
  }, [quizState, currentQuestionIndex, score]);

  const handleStart = () => {
    setQuizState('question');
    setCurrentQuestionIndex(0);
    setScore(0);
    sessionStorage.removeItem('tutiba:practice-quiz');
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
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:transform-none" />
          <span className="font-bold text-sm hidden sm:block">My Courses</span>
        </Link>
        <div className="font-bold text-primary-900 text-sm md:text-base">
          Practice quiz
        </div>
        <button type="button" aria-label="Close quiz" onClick={() => navigate('/my-courses')} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-primary-50 text-primary-500 hover:text-primary-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Quiz Area */}
      <main id="main-content" className="flex-grow py-12 px-4 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">

          {quizState === 'intro' && (
            <QuizIntro
              title="Cosmeceutical foundations practice quiz"
              description="Test your understanding. Your progress is saved in this browser session if you need to return."
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

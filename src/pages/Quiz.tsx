import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { QuizIntro } from '../components/quiz/QuizIntro';
import { QuizQuestion, QuestionData } from '../components/quiz/QuizQuestion';
import { QuizResult } from '../components/quiz/QuizResult';

const mockQuestions: QuestionData[] = [
  {
    id: 1,
    question: "أي من المكونات التالية يعتبر من المرطبات الجاذبة للماء (Humectants)؟",
    options: ["حمض الهيالورونيك", "زيت الجوجوبا", "زبدة الشيا", "السيليكون"],
    correctIndex: 0,
    explanation: "حمض الهيالورونيك يجذب الماء، بينما الزيوت هي مطريات.",
    aiExplanation: {
      scientific: "الـ Humectants هي جزيئات محبة للماء (Hydrophilic) تحتوي على مجموعات هيدروكسيل (-OH) تقوم بعمل روابط هيدروجينية مع جزيئات الماء، مما يسحبها إلى الطبقة القرنية.",
      practical: "سيروم الهيالورونيك من The Ordinary يعتمد كلياً على هذه الخاصية، ولهذا يُنصح بوضعه على بشرة ندية (Damp skin)."
    },
    memoryCoach: {
      type: "رابط ذهني",
      content: "تخيل حمض الهيالورونيك كـ (إسفنجة) عطشى تسحب الماء من الجو المحيط لتروي بها سطح البشرة."
    }
  },
  {
    id: 2,
    question: "ما هو الترتيب الصحيح لطبقات البشرة من الخارج إلى الداخل؟",
    options: [
      "الطبقة القاعدية، الطبقة الشائكة، الطبقة القرنية",
      "الطبقة القرنية، الطبقة الشائكة، الطبقة القاعدية",
      "الطبقة الشائكة، الطبقة القرنية، الطبقة القاعدية",
      "الطبقة القرنية، الطبقة القاعدية، الطبقة الشائكة"
    ],
    correctIndex: 1,
    explanation: "الطبقة القرنية هي الخارجية، والقاعدية هي الأعمق.",
    aiExplanation: {
      scientific: "تبدأ دورة حياة خلية الكيراتين من الطبقة القاعدية (حيث الانقسام)، وتصعد مروراً بالطبقة الشائكة والمحببة لتفقد نواتها وتتسطح في الطبقة القرنية كحاجز حماية.",
      practical: "المقشرات الكيميائية (AHA/BHA) تعمل فقط على الطبقة القرنية السطحية لإزالة الخلايا الميتة، ولا تصل للقاعدية إلا في التقشير الطبي العميق."
    },
    memoryCoach: {
      type: "اختصار",
      content: "تذكر الكلمة (قـ.شـ.ق): قرنية (خارج) -> شائكة (وسط) -> قاعدية (داخل)."
    }
  },
  {
    id: 3,
    question: "متى يكون استخدام المواد الحافظة (Preservatives) إلزامياً في منتجات العناية؟",
    options: [
      "في المنتجات الزيتية 100%",
      "في المنتجات التي تحتوي على ماء (Aqueous)",
      "في المنتجات الصلبة (Solid bars)",
      "جميع المنتجات التجميلية بدون استثناء"
    ],
    correctIndex: 1,
    explanation: "الماء بيئة خصبة للبكتيريا، لذا المنتجات المائية تتطلب مواد حافظة.",
    aiExplanation: {
      scientific: "النشاط المائي (Water Activity - Aw) العالي يسمح للكائنات الدقيقة بالنمو الأسي. المواد الحافظة تعطل الأغشية الخلوية أو إنزيمات هذه البكتيريا والفطريات.",
      practical: "لهذا السبب كريم الوجه يحتاج بارابين أو فينوكسي إيثانول، بينما سيروم فيتامين C الزيتي 100% قد لا يحتاج إلى مادة حافظة ميكروبية (فقط مضاد أكسدة)."
    },
    memoryCoach: {
      type: "صورة ذهنية",
      content: "تخيل (قطرة ماء) كأنها (حمام سباحة) للبكتيريا. أينما وجد المسبح (الماء)، وجب وضع الكلور (المادة الحافظة)."
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
          <span className="font-bold text-sm hidden sm:block">الخروج من الاختبار</span>
        </Link>
        <div className="font-bold text-primary-900 text-sm md:text-base">
          دبلومة العناية بالبشرة والشعر
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
              title="اختبار القسم الثاني: فسيولوجيا البشرة"
              description="هذا الاختبار يقيس مدى فهمك لوظائف طبقات الجلد وحاجز البشرة. تأكدي من مراجعة الملاحظات قبل البدء."
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

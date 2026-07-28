import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Send,
  Award,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Quiz,
  StartQuizResult,
  StudentQuestionPayload,
  GetQuizAttemptResultPayload,
} from '../../types/database.types';

interface QuizLessonRendererProps {
  lessonId: string;
  courseId: string;
  quizTitle?: string;
  onQuizCompleted?: () => void;
}

type QuizPhase = 'loading' | 'intro' | 'active' | 'submitting' | 'submitted' | 'error';

export function QuizLessonRenderer({
  lessonId,
  courseId,
  quizTitle,
  onQuizCompleted,
}: QuizLessonRendererProps) {
  const { user } = useAuth();

  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [quizInfo, setQuizInfo] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StartQuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const [resultData, setResultData] = useState<GetQuizAttemptResultPayload | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Fetch Quiz details & check existing attempts
  const loadQuizAndAttempt = useCallback(async () => {
    if (!user || !lessonId) return;

    try {
      setPhase('loading');
      setErrorMessage(null);

      // Fetch quiz definition for lesson
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_published', true)
        .maybeSingle();

      if (quizError) {
        console.error('Error fetching quiz metadata:', quizError);
        setErrorMessage('Review the quiz information and continue when you are ready.');
        setPhase('error');
        return;
      }

      if (!quiz) {
        setErrorMessage('No items are available yet..');
        setPhase('error');
        return;
      }

      setQuizInfo(quiz as Quiz);

      // Check latest attempt for user and quiz
      const { data: latestAttempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('id, status, attempt_number')
        .eq('user_id', user.id)
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptError) {
        console.error('Error fetching attempt history:', attemptError);
      }

      if (latestAttempt?.status === 'in_progress') {
        // Resume in-progress attempt directly
        await startOrResumeAttempt(quiz.id);
      } else if (latestAttempt?.status === 'submitted') {
        // Fetch result for completed attempt
        await fetchSubmittedResult(latestAttempt.id);
      } else {
        // Show intro screen for new attempt or retry
        setPhase('intro');
      }
    } catch (err: any) {
      console.error('Unexpected error loading quiz:', err);
      setErrorMessage(err.message || 'Review the quiz information and continue when you are ready.');
      setPhase('error');
    }
  }, [user, lessonId]);

  useEffect(() => {
    loadQuizAndAttempt();
  }, [loadQuizAndAttempt]);

  // Timer Effect
  useEffect(() => {
    if (phase !== 'active' || !activeAttempt?.time_limit_minutes || !activeAttempt?.started_at) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const timeLimitMs = activeAttempt.time_limit_minutes * 60 * 1000;
    const startTimeMs = new Date(activeAttempt.started_at).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const remaining = Math.max(0, Math.floor((startTimeMs + timeLimitMs - nowMs) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        setIsTimeExpired(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, activeAttempt]);

  // 2. Start or Resume Attempt via RPC
  const startOrResumeAttempt = async (quizId: string) => {
    try {
      setIsActionLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.rpc('start_quiz_attempt', {
        target_quiz_id: quizId,
      });

      if (error) {
        console.error('RPC start_quiz_attempt error:', error);
        setErrorMessage(error.message || 'Unable to load the quiz.');
        setPhase('error');
        return;
      }

      const attemptPayload = data as unknown as StartQuizResult;
      setActiveAttempt(attemptPayload);

      // Populate initial answers state from saved questions
      const initialAnswers: Record<string, string | null> = {};
      attemptPayload.questions.forEach((q) => {
        initialAnswers[q.question_id] = q.selected_option_id;
      });
      setAnswers(initialAnswers);
      setSavingStatus({});
      setIsTimeExpired(false);
      setPhase('active');
    } catch (err: any) {
      console.error('Error starting quiz attempt:', err);
      setErrorMessage(err.message || 'Review the quiz information and continue when you are ready.');
      setPhase('error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Save Single Answer
  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!activeAttempt || phase !== 'active' || isTimeExpired) return;

    // Local update
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSavingStatus((prev) => ({ ...prev, [questionId]: 'saving' }));

    try {
      const { data, error } = await supabase.rpc('save_quiz_answer', {
        target_attempt_id: activeAttempt.attempt_id,
        target_question_id: questionId,
        target_option_id: optionId,
      });

      if (error) {
        console.error('RPC save_quiz_answer error:', error);
        setSavingStatus((prev) => ({ ...prev, [questionId]: 'error' }));
        if (error.message.includes('Time limit expired')) {
          setIsTimeExpired(true);
        }
      } else {
        setSavingStatus((prev) => ({ ...prev, [questionId]: 'saved' }));
      }
    } catch (err) {
      console.error('Unexpected error saving quiz answer:', err);
      setSavingStatus((prev) => ({ ...prev, [questionId]: 'error' }));
    }
  };

  // 4. Submit Attempt via RPC
  const handleSubmitQuiz = async () => {
    if (!activeAttempt || isActionLoading) return;

    try {
      setIsActionLoading(true);
      setShowSubmitModal(false);
      setPhase('submitting');

      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        target_attempt_id: activeAttempt.attempt_id,
      });

      if (error) {
        console.error('RPC submit_quiz_attempt error:', error);
        setErrorMessage(error.message || 'Unable to load the quiz.');
        setPhase('active'); // allow user to retry submitting
        return;
      }

      const submitRes = data as any;

      if (submitRes.passed) {
        onQuizCompleted?.();
      }

      // Fetch full result
      await fetchSubmittedResult(activeAttempt.attempt_id);
    } catch (err: any) {
      console.error('Unexpected error submitting quiz:', err);
      setErrorMessage(err.message || 'Unable to submit the quiz.');
      setPhase('active');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. Fetch Final Result via RPC
  const fetchSubmittedResult = async (attemptId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_quiz_attempt_result', {
        target_attempt_id: attemptId,
      });

      if (error) {
        console.error('RPC get_quiz_attempt_result error:', error);
        setErrorMessage(error.message || 'Unable to load the quiz.');
        setPhase('error');
        return;
      }

      const resultPayload = data as unknown as GetQuizAttemptResultPayload;
      setResultData(resultPayload);

      if (resultPayload.passed) {
        onQuizCompleted?.();
      }

      setPhase('submitted');
    } catch (err: any) {
      console.error('Unexpected error fetching quiz result:', err);
      setErrorMessage(err.message || 'Unable to load the quiz result.');
      setPhase('error');
    }
  };

  // Format seconds to MM:SS
  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answered questions count
  const totalQuestionsCount = activeAttempt?.questions.length || 0;
  const answeredQuestionsCount = Object.values(answers).filter((val) => val !== null).length;

  // --- RENDER PHASES ---

  // Loading State
  if (phase === 'loading') {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-8 shadow-sm text-center py-16" dir="ltr">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto mb-4" />
        <p className="text-primary-700 font-bold text-base">Loading quiz...</p>
      </div>
    );
  }

  // Error State
  if (phase === 'error') {
    return (
      <div className="bg-white border border-danger-200 rounded-2xl p-6 md:p-8 shadow-sm text-left" dir="ltr">
        <div className="flex items-center gap-3 text-danger-600 mb-4 pb-3 border-b border-danger-100">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <h3 className="font-bold text-lg">Unable to Load Quiz</h3>
        </div>
        <p className="text-primary-700 text-sm leading-relaxed mb-6">{errorMessage || 'Please try again.'}</p>
        <button
          onClick={() => loadQuizAndAttempt()}
          className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Intro State
  if (phase === 'intro' && quizInfo) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-10 shadow-sm text-left" dir="ltr">
        {/* Header Badge */}
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-primary-100 text-amber-600">
          <HelpCircle className="w-6 h-6 flex-shrink-0" />
          <span className="font-bold text-sm">Quiz</span>
        </div>

        <div className="max-w-2xl mx-auto text-center py-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-5 border border-amber-200 shadow-xs">
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-primary-900 mb-3">{quizInfo.title}</h2>

          <p className="text-primary-600 text-base leading-relaxed mb-8">
            {quizInfo.description || 'Complete this quiz to assess your understanding.'}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-200/60">
              <span className="text-xs text-primary-500 font-medium block mb-1">Success</span>
              <span className="text-lg font-bold text-primary-900">{quizInfo.pass_percentage}%</span>
            </div>

            <div className="bg-primary-50 p-4 rounded-xl border border-primary-200/60">
              <span className="text-xs text-primary-500 font-medium block mb-1">Quiz Information</span>
              <span className="text-lg font-bold text-primary-900">
                {quizInfo.time_limit_minutes ? `${quizInfo.time_limit_minutes} minutes` : 'No time limit'}
              </span>
            </div>

            <div className="bg-primary-50 p-4 rounded-xl border border-primary-200/60 col-span-2 sm:col-span-1">
              <span className="text-xs text-primary-500 font-medium block mb-1">Quiz Information</span>
              <span className="text-lg font-bold text-primary-900">
                {quizInfo.max_attempts ? `${quizInfo.max_attempts} attempts` : 'Unlimited'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => startOrResumeAttempt(quizInfo.id)}
            disabled={isActionLoading}
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-sm min-h-[48px] text-base w-full sm:w-auto"
          >
            {isActionLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active or Submitting State
  if ((phase === 'active' || phase === 'submitting') && activeAttempt) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm text-left relative" dir="ltr">
        {/* Sticky Active Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-primary-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80 w-fit mb-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz Information #{activeAttempt.attempt_number} {activeAttempt.max_attempts ? `Quiz Information ${activeAttempt.max_attempts}` : ''}</span>
            </div>
            <h2 className="text-xl font-bold text-primary-900">{activeAttempt.title}</h2>
          </div>

          {/* Timer Badge */}
          {activeAttempt.time_limit_minutes && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold ${
                isTimeExpired
                  ? 'bg-danger-50 text-danger-700 border-danger-200 animate-pulse'
                  : (remainingSeconds ?? 999) < 180
                  ? 'bg-warning-50 text-warning-700 border-warning-200'
                  : 'bg-primary-50 text-primary-800 border-primary-200'
              }`}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {isTimeExpired ? 'Quiz Information' : `Quiz Information: ${formatTimer(remainingSeconds)}`}
              </span>
            </div>
          )}
        </div>

        {/* Time Limit Expired Warning Banner */}
        {isTimeExpired && (
          <div className="p-4 mb-6 bg-danger-50 border border-danger-200 rounded-xl text-danger-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Quiz!</p>
              <p className="text-xs text-danger-800 leading-relaxed">
                Your answers are submitted automatically when you complete the quiz.
              </p>
            </div>
          </div>
        )}

        {/* Progress Summary Header */}
        <div className="mb-8 bg-primary-50 p-4 rounded-xl border border-primary-200/80 flex items-center justify-between gap-4">
          <div className="text-xs font-bold text-primary-700">
            Quiz Information: <span className="text-amber-700">{answeredQuestionsCount}</span> Quiz Information <span className="text-primary-900">{totalQuestionsCount}</span> Quiz Information
          </div>
          <div className="w-32 sm:w-48 bg-primary-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalQuestionsCount > 0 ? (answeredQuestionsCount / totalQuestionsCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-8 mb-10">
          {activeAttempt.questions.map((question, qIdx) => {
            const selectedOptionId = answers[question.question_id] || null;
            const status = savingStatus[question.question_id];

            return (
              <div
                key={question.question_id}
                className="p-5 md:p-6 rounded-2xl border border-primary-200 bg-white shadow-2xs hover:border-primary-300 transition-colors"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-primary-900 leading-snug">
                      {question.question_text}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-primary-500 bg-primary-100 px-2.5 py-1 rounded-md">
                      {question.points} {question.points === 1 ? 'point' : 'points'}
                    </span>
                    {status === 'saving' && (
                      <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </span>
                    )}
                    {status === 'saved' && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Save
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Options */}
                <div className="space-y-3 mt-4">
                  {question.options.map((option) => {
                    const isSelected = selectedOptionId === option.option_id;

                    return (
                      <button
                        key={option.option_id}
                        type="button"
                        disabled={isTimeExpired || phase === 'submitting'}
                        onClick={() => handleSelectOption(question.question_id, option.option_id)}
                        className={`w-full text-left p-4 rounded-xl border text-sm md:text-base font-medium transition-all flex items-center justify-between min-h-[48px] ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-bold shadow-xs'
                            : 'border-primary-200 hover:border-amber-300 hover:bg-primary-50/50 text-primary-800'
                        } ${isTimeExpired ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="leading-relaxed pl-4">{option.option_text}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-primary-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Actions Bar */}
        <div className="pt-6 border-t border-primary-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-primary-500">
            * Select the best answer for each question.
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={phase === 'submitting'}
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm min-h-[48px] text-base"
          >
            {phase === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Quiz</span>
              </>
            )}
          </button>
        </div>

        {/* Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-primary-900 mb-2">Quiz</h3>

              <p className="text-primary-600 text-sm leading-relaxed mb-4">
                Answer <span className="font-bold text-amber-700">{answeredQuestionsCount}</span> Quiz Information <span className="font-bold text-primary-900">{totalQuestionsCount}</span> Quiz Information.
              </p>

              {answeredQuestionsCount < totalQuestionsCount && (
                <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl text-warning-800 text-xs mb-6 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                  <span>Quiz Information: Answer.</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isActionLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isActionLoading}
                  className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Submitted Results View
  if (phase === 'submitted' && resultData) {
    const isPassed = resultData.passed;

    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm text-left" dir="ltr">
        {/* Result Header Hero Banner */}
        <div
          className={`p-6 md:p-8 rounded-2xl mb-8 border text-center ${
            isPassed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-danger-50/80 border-danger-200 text-danger-950'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-xs ${
              isPassed
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-danger-100 border-danger-300 text-danger-700'
            }`}
          >
            {isPassed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {isPassed ? 'Congratulations! Quiz' : 'Success'}
          </h2>

          <p className="text-sm opacity-80 mb-6">
            {isPassed
              ? 'Your quiz attempt could not be submitted. Please try again.'
              : `Success ${resultData.pass_percentage}%. Retry.`}
          </p>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
            <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-black/5 shadow-xs">
              <span>Result: </span>
              <span className={isPassed ? 'text-emerald-700' : 'text-danger-700'}>
                {resultData.score_percentage}%
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-black/5 shadow-xs">
              <span>Quiz Information: </span>
              <span>
                {resultData.score_points} of {resultData.total_points}
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-black/5 shadow-xs">
              <span>Quiz Information: </span>
              <span className={isPassed ? 'text-emerald-700' : 'text-danger-700'}>
                {isPassed ? 'Quiz Information' : 'Quiz Information'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Questions Review */}
        <h3 className="text-lg font-bold text-primary-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          <span>Quiz Information:</span>
        </h3>

        <div className="space-y-8 mb-10">
          {resultData.questions.map((question, qIdx) => {
            const isCorrectAnswer = question.is_correct === true;

            return (
              <div
                key={question.question_id}
                className={`p-5 md:p-6 rounded-2xl border transition-colors ${
                  isCorrectAnswer ? 'border-emerald-200 bg-emerald-50/20' : 'border-danger-200 bg-danger-50/20'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCorrectAnswer
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-danger-100 text-danger-800'
                      }`}
                    >
                      {qIdx + 1}
                    </span>
                    <h4 className="text-base md:text-lg font-bold text-primary-900 leading-snug">
                      {question.question_text}
                    </h4>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0 ${
                      isCorrectAnswer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-danger-100 text-danger-800'
                    }`}
                  >
                    {question.points_awarded || 0} / {question.points} points
                  </span>
                </div>

                {/* Options Review */}
                <div className="space-y-3 mt-4">
                  {question.options.map((option) => {
                    const isSelected = question.selected_option_id === option.option_id;
                    const isCorrectOption = option.is_correct;

                    let optionStyle = 'border-primary-200 bg-white text-primary-800';
                    let iconNode = null;

                    if (isCorrectOption) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                      iconNode = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = 'border-danger-500 bg-danger-50 text-danger-950 font-bold';
                      iconNode = <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />;
                    }

                    return (
                      <div
                        key={option.option_id}
                        className={`p-4 rounded-xl border text-sm md:text-base font-medium flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="leading-relaxed">{option.option_text}</span>
                          {isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-black/5 font-semibold">
                              Quiz Information
                            </span>
                          )}
                        </div>
                        {iconNode}
                      </div>
                    );
                  })}
                </div>

                {/* Question Explanation Box */}
                {question.explanation && (
                  <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-950 text-sm leading-relaxed">
                    <span className="font-bold block mb-1 text-amber-900">Quiz Information:</span>
                    <p className="text-amber-900/90 text-xs md:text-sm">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Retry / Re-attempt Action */}
        <div className="pt-6 border-t border-primary-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-primary-500">
            Result.
          </div>

          {quizInfo &&
            (quizInfo.max_attempts === null ||
              (resultData && (resultData as any).attempt_number < quizInfo.max_attempts)) && (
              <button
                onClick={() => startOrResumeAttempt(quizInfo.id)}
                disabled={isActionLoading}
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm text-sm"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry</span>
                  </>
                )}
              </button>
            )}
        </div>
      </div>
    );
  }

  return null;
}

import React, { useState } from 'react';
import { HelpCircle, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface QuizLessonPlaceholderProps {
  title: string;
}

export function QuizLessonPlaceholder({ title }: QuizLessonPlaceholderProps) {
  const [showInfoNotice, setShowInfoNotice] = useState(false);

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-10 shadow-sm text-right" dir="rtl">
      {/* Quiz Header Badge */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-primary-100 text-amber-600">
        <HelpCircle className="w-6 h-6 flex-shrink-0" />
        <span className="font-bold text-sm">اختبار تقييمي</span>
      </div>

      <div className="max-w-2xl mx-auto text-center py-6">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-5 border border-amber-200">
          <HelpCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-primary-900 mb-3">{title || 'اختبار الدرس'}</h2>

        <p className="text-primary-600 text-base leading-relaxed mb-6">
          اختبر فهمك لمحتوى هذا القسم. سيتم تسجيل هذا الدرس كمكتمل بعد اجتياز الاختبار.
        </p>

        <p className="text-xs text-primary-400 mb-8 font-medium">
          سيتم ربط الاختبار بنتيجة التقدم في المرحلة التالية.
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowInfoNotice(true)}
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-sm min-h-[48px] text-base"
          >
            <span>بدء الاختبار</span>
            <ArrowLeft className="w-5 h-5" />
          </button>

          {showInfoNotice && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm max-w-md w-full flex items-start gap-3 text-right">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">نظام الاختبارات التفاعلية</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  سيتم إطلاق المحرك التفاعلي للاختبارات قريباً. عند إتاحته، ستتمكن من تقديم الاختبار وتوثيق النتيجة في سيرج التعلم فور الاجتياز.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

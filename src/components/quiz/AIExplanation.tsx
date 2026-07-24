import React from 'react';
import { Sparkles, FlaskConical, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIExplanationProps {
  isCorrect: boolean;
  briefExplanation: string;
  scientificExplanation?: string;
  practicalExample?: string;
}

export function AIExplanation({ isCorrect, briefExplanation, scientificExplanation, practicalExample }: AIExplanationProps) {
  return (
    <div className="bg-accent-50 border border-accent-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none motion-reduce:transform-none">
      {/* Immediate Feedback Header */}
      <div className={`p-4 md:p-5 flex items-start gap-3 border-b ${isCorrect ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
        <div className="mt-0.5 flex-shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-success-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-danger-600" />
          )}
        </div>
        <div>
          <h4 className={`font-bold mb-1 ${isCorrect ? 'text-success-900' : 'text-danger-900'}`}>
            {isCorrect ? 'إجابة صحيحة!' : 'إجابة غير صحيحة'}
          </h4>
          <p className={`text-sm leading-relaxed ${isCorrect ? 'text-success-800' : 'text-danger-800'}`}>
            {briefExplanation}
          </p>
        </div>
      </div>

      {/* AI Deep Dive */}
      {(scientificExplanation || practicalExample) && (
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4 text-accent-700">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-sm">تفسير المساعد الذكي</h3>
          </div>
          
          <div className="space-y-4">
            {scientificExplanation && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-accent-600 flex-shrink-0 shadow-sm">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-accent-800 mb-1">المبدأ العلمي</h4>
                  <p className="text-sm text-primary-800 font-medium leading-relaxed">{scientificExplanation}</p>
                </div>
              </div>
            )}
            
            {practicalExample && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-accent-600 flex-shrink-0 shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-accent-800 mb-1">تطبيق من السوق</h4>
                  <p className="text-sm text-primary-800 font-medium leading-relaxed">{practicalExample}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

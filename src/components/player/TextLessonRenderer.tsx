import React from 'react';
import { FileText, AlignRight } from 'lucide-react';

interface TextLessonRendererProps {
  content: string | null;
  title: string;
}

export function TextLessonRenderer({ content, title }: TextLessonRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-8 md:p-12 text-center text-primary-600 shadow-sm">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-4 border border-primary-100">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-primary-900 mb-2">Content</h3>
        <p className="text-primary-500 max-w-md mx-auto text-sm leading-relaxed">
          Add. Please review the information and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-10 shadow-sm text-left" dir="ltr">
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-primary-100 text-accent-700">
        <AlignRight className="w-5 h-5 flex-shrink-0" />
        <span className="font-bold text-sm">Content/Details</span>
      </div>

      <div className="prose prose-slate max-w-none text-primary-800 leading-relaxed space-y-4 font-normal text-base whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

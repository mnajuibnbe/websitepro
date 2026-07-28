import React, { useState } from 'react';
import { Brain, BookmarkPlus, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface MemoryCoachProps {
  type: string;
  content: string;
}

export function MemoryCoach({ type, content }: MemoryCoachProps) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none motion-reduce:transform-none">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 flex-shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-warning-700 mb-1">Memory Coach ({type})</h4>
          <p className="text-sm text-primary-800 font-bold leading-relaxed">
            {content}
          </p>
        </div>
      </div>

      <Button
        variant={isSaved ? 'secondary' : 'primary'}
        className={`flex-shrink-0 text-sm h-10 px-4 w-full sm:w-auto transition-colors ${isSaved ? 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100 hover:text-success-800 hover:border-success-300' : ''}`}
        onClick={() => setIsSaved(true)}
        icon={isSaved ? <Check className="w-4 h-4 text-success-600" /> : <BookmarkPlus className="w-4 h-4" />}
      >
        {isSaved ? 'Save' : 'Save'}
      </Button>
    </div>
  );
}

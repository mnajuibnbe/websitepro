import React, { useState } from 'react';
import { FolderX, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function WrongAnswersAction() {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="animate-in fade-in duration-300 w-full sm:w-auto">
      <Button 
        variant={isSaved ? 'secondary' : 'secondary'}
        className={`w-full sm:w-auto h-10 px-4 text-sm transition-colors ${isSaved ? 'bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100 hover:text-danger-800' : 'text-danger-600 border-danger-200 hover:bg-danger-50'}`}
        onClick={() => setIsSaved(true)}
        icon={isSaved ? <Check className="w-4 h-4" /> : <FolderX className="w-4 h-4" />}
      >
        {isSaved ? 'مجدول للمراجعة' : 'حفظ في بنك الأخطاء'}
      </Button>
    </div>
  );
}

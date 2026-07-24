import React from 'react';
import { ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';

export function Pagination() {
  return (
    <div className="flex items-center justify-center gap-2">
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-400 cursor-not-allowed bg-primary-50">
        {/* In RTL, previous page points to the right */}
        <ChevronRight className="w-5 h-5" />
      </button>
      
      <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent-600 text-white font-bold shadow-sm">
        1
      </button>
      
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors">
        2
      </button>
      
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors">
        3
      </button>
      
      <div className="w-10 h-10 flex items-center justify-center text-primary-400">
        <MoreHorizontal className="w-5 h-5" />
      </div>
      
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors">
        8
      </button>
      
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors">
        {/* In RTL, next page points to the left */}
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 disabled:text-primary-400 disabled:cursor-not-allowed disabled:bg-primary-50"
      >
        {/* In RTL, previous page points to the right */}
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border font-bold transition-colors ${
            page === currentPage
              ? 'bg-accent-600 border-accent-600 text-white shadow-sm'
              : 'border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-200 text-primary-700 disabled:text-primary-400 disabled:cursor-not-allowed disabled:bg-primary-50"
      >
        {/* In RTL, next page points to the left */}
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}

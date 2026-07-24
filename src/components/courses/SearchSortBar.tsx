import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

export function SearchSortBar() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-primary-200 mb-8">
      
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-primary-400">
          <Search className="w-5 h-5" />
        </div>
        <input 
          type="text" 
          placeholder="ابحثي باسم الكورس أو الموضوع..." 
          className="w-full h-12 pr-12 pl-4 bg-white border border-primary-300 rounded-lg text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 shadow-sm"
        />
      </div>

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6">
        <span className="text-primary-600 font-medium hidden sm:block">
          <strong className="text-primary-900 text-lg mx-1">8</strong> كورسات
        </span>

        {/* Mobile Filter Button */}
        <button className="lg:hidden flex items-center justify-center gap-2 h-12 px-4 bg-white border border-primary-300 rounded-lg text-primary-900 font-bold hover:bg-primary-50 transition-colors shadow-sm w-1/2 sm:w-auto">
          <Filter className="w-5 h-5" />
          <span>فلاتر</span>
        </button>

        <div className="flex items-center gap-3 w-1/2 sm:w-auto">
          <span className="text-sm font-medium text-primary-600 hidden sm:block">الترتيب:</span>
          <div className="relative w-full sm:w-auto">
            <select 
              className="w-full sm:w-auto appearance-none bg-white border border-primary-300 rounded-lg pl-10 pr-4 py-2.5 h-12 text-sm font-bold text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer shadow-sm"
              defaultValue="popular"
            >
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر شعبية</option>
              <option value="price-asc">السعر: من الأقل</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CourseCard } from '../ui/CourseCard';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from './Pagination';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

export function CourseGrid() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setCourses(data || []);
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الكورسات. يرجى المحاولة لاحقاً.');
      console.error('Error fetching courses:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-600 font-medium">جاري تحميل الكورسات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-danger-50 text-danger-600 px-6 py-6 rounded-xl border border-danger-200 text-center max-w-md">
          <p className="font-bold mb-4">{error}</p>
          <Button variant="primary" onClick={fetchCourses} className="mx-auto flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <div className="bg-primary-50 text-primary-600 px-6 py-8 rounded-xl border border-primary-200 text-center max-w-md w-full">
          <p className="font-bold mb-2">لا توجد كورسات</p>
          <p>لم يتم العثور على أي كورسات متاحة حالياً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow">
      {/* Applied Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="text-sm font-bold text-primary-900 ml-2">الفلاتر المُطبقة:</span>
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer group">
          <span>العناية بالبشرة</span>
          <X className="w-4 h-4 text-primary-400 group-hover:text-danger-500" />
        </div>
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer group">
          <span>مبتدئ</span>
          <X className="w-4 h-4 text-primary-400 group-hover:text-danger-500" />
        </div>
        <button className="text-sm font-bold text-accent-600 hover:text-accent-700 mr-2 transition-colors">
          مسح الكل
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {courses.map(course => (
          <CourseCard 
            key={course.id}
            title={course.title}
            category="Course" 
            description={course.description}
            duration="TBD"
            lessonsCount={0}
            price={typeof course.price === 'number' ? course.price : parseFloat(course.price || '0')}
            imageUrl={course.thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop'}
            ctaText="استعرضي الكورس"
            onEnroll={() => navigate(`/course/${course.id}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
}

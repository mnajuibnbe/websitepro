import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Save, Image as ImageIcon, Video, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function CourseEditor({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lessons, setLessons] = useState([{ id: 1, title: '', url: '' }]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const addLesson = () => {
    setLessons([...lessons, { id: Date.now(), title: '', url: '' }]);
  };

  const removeLesson = (id: number) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary-900">إضافة/تعديل كورس</h1>
            <Button variant="primary" className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">حفظ الكورس</span>
            </Button>
          </div>

          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-primary-900 mb-6">المعلومات الأساسية</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">عنوان الكورس</label>
                  <input type="text" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 transition-colors" placeholder="مثال: دبلومة العناية بالبشرة الشاملة" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">الوصف</label>
                  <textarea rows={4} className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 transition-colors resize-none" placeholder="اكتب وصفاً شاملاً للكورس..."></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">السعر (ر.س)</label>
                    <input type="number" className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 transition-colors" placeholder="0" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">صورة الغلاف</label>
                    <div className="w-full h-[52px] border-2 border-dashed border-primary-300 rounded-xl flex items-center justify-center text-primary-500 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">رفع صورة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-2xl border border-primary-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary-900">المحتوى والدروس</h2>
                <Button variant="secondary" className="text-sm py-2 px-4 bg-white" onClick={addLesson}>
                  <Plus className="w-4 h-4 ml-1" /> إضافة درس
                </Button>
              </div>

              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="p-4 border border-primary-200 rounded-xl bg-primary-50 relative group">
                    <button 
                      onClick={() => removeLesson(lesson.id)}
                      className="absolute left-4 top-4 text-primary-400 hover:text-danger-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-700 mb-1">عنوان الدرس {index + 1}</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 text-sm" placeholder="اسم الدرس" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary-700 mb-1">رابط الفيديو (URL)</label>
                        <div className="relative">
                          <Video className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                          <input type="text" className="w-full pr-9 pl-3 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 text-sm" placeholder="https://..." dir="ltr" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {lessons.length === 0 && (
                  <div className="text-center py-8 text-primary-500 bg-primary-50 rounded-xl border border-dashed border-primary-300">
                    لم يتم إضافة أي دروس بعد.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

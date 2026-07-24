import React, { useState } from 'react';
import { CheckCircle2, PlayCircle, Lock, MonitorPlay, FileText, ChevronDown } from 'lucide-react';

interface CourseSidebarProps {
  onLessonSelect?: () => void;
}

export function CourseSidebar({ onLessonSelect }: CourseSidebarProps) {
  const [openSection, setOpenSection] = useState<number | null>(2);

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  const curriculum = [
    {
      id: 1,
      title: 'مقدمة في علم الكوسميسوتيكال',
      completedLessons: 3,
      totalLessons: 3,
      lessons: [
        { id: 101, title: 'ما هو الكوسميسوتيكال؟', duration: '15 دقيقة', type: 'video', status: 'completed' },
        { id: 102, title: 'الفرق بين المنتجات التجميلية والعلاجية', duration: '20 دقيقة', type: 'video', status: 'completed' },
        { id: 103, title: 'كيف تقرأ ملصق المكونات (INCI)', duration: '10 دقائق', type: 'document', status: 'completed' },
      ]
    },
    {
      id: 2,
      title: 'تشريح وفسيولوجيا البشرة',
      completedLessons: 1,
      totalLessons: 4,
      lessons: [
        { id: 201, title: 'طبقات الجلد ووظائفها', duration: '18 دقيقة', type: 'video', status: 'completed' },
        { id: 202, title: 'حاجز البشرة (Skin Barrier)', duration: '15 دقيقة', type: 'video', status: 'current' },
        { id: 203, title: 'أنواع البشرة وكيفية تحديدها علمياً', duration: '20 دقيقة', type: 'video', status: 'locked' },
        { id: 204, title: 'اختبار القسم الأول', duration: '3 أسئلة', type: 'quiz', status: 'current' },
      ]
    },
    {
      id: 3,
      title: 'المرطبات والمواد الحافظة',
      completedLessons: 0,
      totalLessons: 5,
      lessons: [
        { id: 301, title: 'آلية عمل المرطبات', duration: '25 دقيقة', type: 'video', status: 'locked' },
        { id: 302, title: 'حمض الهيالورونيك والجليسرين', duration: '20 دقيقة', type: 'video', status: 'locked' },
      ]
    }
  ];

  return (
    <div className="bg-white border border-primary-200 rounded-2xl flex flex-col h-full max-h-[800px] shadow-sm">
      <div className="p-4 border-b border-primary-200">
        <h2 className="font-bold text-primary-900 mb-2">محتوى الكورس</h2>
        <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full" style={{ width: '35%' }}></div>
        </div>
        <p className="text-xs text-primary-500 font-medium mt-2">مكتمل 35% (4 من 12 درس)</p>
      </div>

      <div className="overflow-y-auto flex-grow hide-scrollbar">
        {curriculum.map((section) => (
          <div key={section.id} className="border-b border-primary-100 last:border-none">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 min-h-[44px] hover:bg-primary-50 transition-colors focus:outline-none"
            >
              <div className="flex flex-col items-start gap-1 text-right">
                <span className={`font-bold text-sm ${openSection === section.id ? 'text-primary-900' : 'text-primary-800'}`}>
                  {section.title}
                </span>
                <span className="text-xs text-primary-500 font-medium">
                  {section.completedLessons} / {section.totalLessons} دروس
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform duration-300 ${openSection === section.id ? 'rotate-180' : ''}`} />
            </button>

            <div 
              className={`overflow-hidden transition-all duration-300 ${openSection === section.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="bg-primary-50/50 pb-2">
                {section.lessons.map((lesson) => (
                  <button 
                    key={lesson.id} 
                    onClick={() => {
                      if (lesson.type === 'quiz') {
                        window.location.hash = '#/quiz';
                      }
                      if (onLessonSelect) onLessonSelect();
                    }}
                    className={`w-full flex items-start gap-3 p-3 px-4 min-h-[44px] transition-colors text-right group ${
                      lesson.status === 'current' 
                        ? 'bg-accent-50 border-r-4 border-accent-600' 
                        : 'border-r-4 border-transparent hover:bg-white'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {lesson.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-success-500" />}
                      {lesson.status === 'current' && <PlayCircle className="w-5 h-5 text-accent-600" />}
                      {lesson.status === 'locked' && <Lock className="w-5 h-5 text-primary-300" />}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className={`text-sm leading-snug mb-1 ${
                        lesson.status === 'current' ? 'font-bold text-accent-900' : 
                        lesson.status === 'completed' ? 'font-medium text-primary-700' : 'font-medium text-primary-500'
                      }`}>
                        {lesson.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-primary-400 font-medium">
                        {lesson.type === 'video' ? <MonitorPlay className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ChevronDown, PlayCircle, Lock, MonitorPlay, FileText } from 'lucide-react';

export function CurriculumAccordion() {
  const [openSection, setOpenSection] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  const curriculum = [
    {
      id: 1,
      title: 'مقدمة في علم الكوسميسوتيكال',
      duration: '3 دروس • 45 دقيقة',
      lessons: [
        { id: 101, title: 'ما هو الكوسميسوتيكال؟', duration: '15 دقيقة', type: 'video', isPreview: true },
        { id: 102, title: 'الفرق بين المنتجات التجميلية والعلاجية', duration: '20 دقيقة', type: 'video', isPreview: false },
        { id: 103, title: 'كيف تقرأ ملصق المكونات (INCI)', duration: '10 دقائق', type: 'document', isPreview: false },
      ]
    },
    {
      id: 2,
      title: 'تشريح وفسيولوجيا البشرة',
      duration: '4 دروس • 60 دقيقة',
      lessons: [
        { id: 201, title: 'طبقات الجلد ووظائفها', duration: '18 دقيقة', type: 'video', isPreview: false },
        { id: 202, title: 'حاجز البشرة (Skin Barrier)', duration: '15 دقيقة', type: 'video', isPreview: false },
        { id: 203, title: 'أنواع البشرة وكيفية تحديدها علمياً', duration: '20 دقيقة', type: 'video', isPreview: false },
        { id: 204, title: 'اختبار القسم الأول', duration: '7 أسئلة', type: 'quiz', isPreview: false },
      ]
    },
    {
      id: 3,
      title: 'المرطبات والمواد الحافظة',
      duration: '5 دروس • 85 دقيقة',
      lessons: [
        { id: 301, title: 'آلية عمل المرطبات (Humectants, Emollients, Occlusives)', duration: '25 دقيقة', type: 'video', isPreview: false },
        { id: 302, title: 'حمض الهيالورونيك والجليسرين', duration: '20 دقيقة', type: 'video', isPreview: false },
        { id: 303, title: 'السيراميد والأحماض الدهنية', duration: '15 دقيقة', type: 'video', isPreview: false },
        { id: 304, title: 'المواد الحافظة ودورها في المنتجات', duration: '15 دقيقة', type: 'video', isPreview: false },
        { id: 305, title: 'حالة عملية: تحليل كريم مرطب شهير', duration: '10 دقائق', type: 'video', isPreview: false },
      ]
    }
  ];

  return (
    <div className="mb-12 md:mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">
            منهج الكورس
          </h2>
          <p className="text-primary-600 font-medium">12 قسم • 45 درس • 80 ساعة تعليمية</p>
        </div>
      </div>

      <div className="border border-primary-200 rounded-xl overflow-hidden shadow-sm bg-white">
        {curriculum.map((section, index) => (
          <div key={section.id} className={`${index !== curriculum.length - 1 ? 'border-b border-primary-200' : ''}`}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-5 md:p-6 bg-primary-50 hover:bg-primary-100 transition-colors focus:outline-none"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold text-lg text-primary-900">{section.title}</span>
                <span className="text-sm text-primary-500 font-medium">{section.duration}</span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-primary-200 text-primary-500 transition-transform duration-300 ${openSection === section.id ? 'rotate-180 text-accent-600 border-accent-200' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>

            <div 
              className={`overflow-hidden transition-all duration-300 ${openSection === section.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-2 md:p-4 bg-white">
                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-primary-50 rounded-lg transition-colors group gap-3 sm:gap-4 border-b border-primary-50 last:border-none">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 group-hover:text-accent-600 group-hover:bg-accent-50 transition-colors flex-shrink-0 mt-0.5 sm:mt-0">
                        {lesson.type === 'video' ? <MonitorPlay className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-primary-800 leading-snug">{lesson.title}</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-11 sm:pl-0">
                      <span className="text-sm text-primary-500 font-medium">{lesson.duration}</span>
                      {lesson.isPreview ? (
                        <button className="flex items-center gap-1.5 text-accent-600 hover:text-accent-700 font-bold text-sm bg-accent-50 px-3 py-1.5 rounded-full transition-colors">
                          <PlayCircle className="w-4 h-4" />
                          <span>معاينة</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 text-primary-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

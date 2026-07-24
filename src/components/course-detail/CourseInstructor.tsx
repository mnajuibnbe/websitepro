import React from 'react';
import { Button } from '../ui/Button';
import { Award, BookOpen, GraduationCap } from 'lucide-react';

export function CourseInstructor() {
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        المدربة
      </h2>
      <div className="bg-white border border-primary-200 p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-right">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0 border-4 border-primary-50 shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop" 
              alt="د. آية البراشي" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-primary-900 mb-2">د. آية البراشي</h3>
            <p className="text-accent-600 font-bold mb-4">طبيبة صيدلانية وخبيرة في الكوسميسوتيكال</p>
            <p className="text-primary-600 leading-relaxed mb-6 font-medium">
              متخصصة في العلوم الصيدلانية وتطبيقات العناية بالبشرة والشعر. تسعى دائماً لربط الجانب النظري الأكاديمي بالتطبيق العملي في سوق العمل، لتمكين المهنيين الصحيين من تقديم استشارات دقيقة وموثوقة مبنية على أسس علمية واضحة.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-right">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">أكثر من 10 سنوات</span>
                  <span className="text-xs text-primary-500 font-medium">خبرة في المجال</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">8 برامج تعليمية</span>
                  <span className="text-xs text-primary-500 font-medium">متخصصة وناجحة</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-600 flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-primary-900">1000+ طالب</span>
                  <span className="text-xs text-primary-500 font-medium">في مختلف التخصصات</span>
                </div>
              </div>
            </div>
            
            <Button variant="secondary" className="w-full sm:w-auto">
              عرض الملف الشخصي للمدربة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

export function InstructorSection() {
  return (
    <section className="py-16 md:py-24 bg-primary-50 border-t border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Instructor Image (5 cols on Desktop) */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-primary-200">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop" 
                alt="د. آية البراشي" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-md border border-primary-100 hidden md:block">
              <div className="flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-3xl font-bold text-accent-600">10+</span>
                <span className="text-sm text-primary-600 font-semibold uppercase tracking-wider">سنوات خبرة</span>
              </div>
            </div>
          </div>

          {/* Instructor Content (7 cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start text-right order-1 lg:order-2">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100 text-accent-800 text-sm font-bold mb-6 uppercase tracking-wider">
              Your Instructor
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-6">
              تعلّمي مع د. آية البراشي
            </h2>
            <p className="text-lg text-primary-600 mb-8 leading-relaxed max-w-2xl">
              طبيبة صيدلانية متخصصة في الكوسميسوتيكال والعناية بالبشرة والشعر. أؤمن بأن العلم هو الأساس الحقيقي لبناء روتين العناية الصحيح وتقييم المنتجات بعيداً عن التسويق المضلل. هدفي هو تمكين المهنيين الصحيين من فهم التركيبات الكيميائية وتطبيقها بأسس علمية دقيقة.
            </p>
            
            <ul className="space-y-4 mb-10 text-primary-800 font-medium">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">متخصصة في العلوم الصيدلانية وتطبيقات الكوسميسوتيكال</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">منهجية علمية مبنية على الأدلة بعيداً عن التسويق</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-600 flex-shrink-0" />
                <span className="text-lg">خبرة عملية في تحليل تركيبات المنتجات العالمية</span>
              </li>
            </ul>

            <Button variant="secondary" className="px-8 text-lg h-12">
              تعرفي على المدربة
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}

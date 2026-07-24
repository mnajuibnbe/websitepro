import React from 'react';
import { Star } from 'lucide-react';

export function CourseReviews() {
  const reviews = [
    {
      id: 1,
      name: "د. سارة أحمد",
      profession: "صيدلانية",
      date: "قبل شهر",
      rating: 5,
      content: "أخيراً وجدت محتوى عربي يشرح الكوسميسوتيكال بعمق علمي. الدورة غيرت طريقتي في قراءة مكونات المنتجات تماماً وبنيت ثقتي في تقديم الاستشارات في الصيدلية."
    },
    {
      id: 2,
      name: "د. نورة محمد",
      profession: "طبيبة أمراض جلدية",
      date: "قبل 3 أشهر",
      rating: 5,
      content: "المعلومات منظمة جداً والتطبيق العملي بعد كل درس ساعدني كثيراً في تقديم نصائح أفضل للمراجعين في عيادتي الخاصة. الكورس دسم جداً."
    },
    {
      id: 3,
      name: "أمل عبدالله",
      profession: "متخصصة عناية بالبشرة",
      date: "قبل أسبوعين",
      rating: 5,
      content: "الدبلومة رائعة، شرح د. آية سلس جداً ويوصل المعلومة المعقدة بطريقة سهلة. طريقة ربط المكونات بالحالات العملية هي أفضل ما في الكورس."
    }
  ];

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        تقييمات الطلاب
      </h2>
      
      <div className="bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm">
        
        {/* Overall Rating */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12 mb-10 pb-8 border-b border-primary-100">
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-5xl font-bold text-primary-900 mb-2">4.9</span>
            <div className="flex items-center text-warning-500 mb-1">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current opacity-50" />
            </div>
            <span className="text-sm text-primary-500 font-medium">120 تقييم</span>
          </div>
          
          {/* Rating Bars - Mockup */}
          <div className="flex-grow w-full max-w-sm space-y-2">
            {[
              { stars: 5, percentage: 85 },
              { stars: 4, percentage: 10 },
              { stars: 3, percentage: 3 },
              { stars: 2, percentage: 1 },
              { stars: 1, percentage: 1 },
            ].map((bar) => (
              <div key={bar.stars} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-primary-600 font-medium flex items-center justify-end gap-1">
                  {bar.stars} <Star className="w-3 h-3 fill-current text-warning-500" />
                </span>
                <div className="flex-grow h-2 bg-primary-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warning-500 rounded-full" 
                    style={{ width: `${bar.percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-primary-500 text-left">{bar.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900">{review.name}</h4>
                    <div className="text-xs text-primary-500 font-medium">{review.profession}</div>
                  </div>
                </div>
                <span className="text-xs text-primary-400 font-medium">{review.date}</span>
              </div>
              <div className="flex items-center text-warning-500 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-primary-700 text-sm leading-relaxed font-medium">
                "{review.content}"
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button className="text-accent-600 font-bold hover:text-accent-700 transition-colors">
            عرض المزيد من التقييمات
          </button>
        </div>
      </div>
    </div>
  );
}

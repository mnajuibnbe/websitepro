import React from 'react';
import { Info } from 'lucide-react';

export function Requirements() {
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">
        المتطلبات
      </h2>
      <div className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm">
        <ul className="space-y-3 text-primary-700 font-medium">
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-500"></div>
            <span>لا يتطلب الكورس خبرة مسبقة عميقة في الكيمياء الصيدلانية، حيث يتم شرح الأساسيات بأسلوب مبسط.</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-500"></div>
            <span>الرغبة في التعلم المبني على الأدلة بعيداً عن الآراء الشخصية.</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-500"></div>
            <span>جهاز حاسوب أو هاتف ذكي مع اتصال إنترنت لمتابعة الدروس.</span>
          </li>
        </ul>
        <div className="mt-6 flex items-start gap-3 bg-info-100 text-info-700 p-4 rounded-lg text-sm font-medium">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            هذا البرنامج يبدأ من الأساسيات ويتدرج بك حتى المستوى المتقدم. إذا كنتِ طبيبة أو صيدلانية، سيساعدك هذا في ترتيب معلوماتك وربطها بالواقع العملي.
          </p>
        </div>
      </div>
    </div>
  );
}

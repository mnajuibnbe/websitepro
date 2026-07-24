import React, { useEffect } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function Terms({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <MarketingNavbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">شروط الاستخدام</h1>
                <p className="text-primary-600">آخر تحديث: 23 يوليو 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. قبول الشروط</h2>
                <p className="leading-relaxed">
                  باستخدامك لمنصة توتيبا (Tutiba)، فإنك توافق على الالتزام بشروط الاستخدام الموضحة أدناه. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. الملكية الفكرية</h2>
                <p className="leading-relaxed">
                  جميع المحتويات التعليمية (فيديوهات، ملفات PDF، نصوص، تصميمات) هي ملكية حصرية لمنصة توتيبا. يُمنع منعاً باتاً نسخ، توزيع، أو بيع أي من هذه المحتويات دون إذن كتابي مسبق.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. حسابات المستخدمين</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك.</li>
                  <li>لا يُسمح بمشاركة الحساب الواحد مع أشخاص آخرين.</li>
                  <li>يحتفظ فريق المنصة بالحق في إيقاف أي حساب يثبت قيامه بمشاركة المحتوى المدفوع أو انتهاك حقوق الملكية.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. الشهادات والإتمام</h2>
                <p className="leading-relaxed">
                  يتم منح الشهادات فقط بعد استكمال جميع متطلبات الدورة بنجاح، بما في ذلك مشاهدة الدروس واجتياز الاختبارات المقررة بالنسبة المحددة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. الاسترداد والإلغاء</h2>
                <p className="leading-relaxed">
                  تخضع سياسة استرداد الأموال للشروط المحددة في "سياسة الاسترجاع". بشكل عام، يمكن طلب الاسترداد خلال 14 يوماً من تاريخ الشراء، بشرط عدم استهلاك أكثر من 10% من محتوى الكورس.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-primary-200">
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('#/');
                }}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-accent-600 transition-colors font-bold"
              >
                <ArrowRight className="w-5 h-5" />
                العودة للصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import React, { useEffect } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function PrivacyPolicy({ onNavigate }: { onNavigate: (path: string) => void }) {
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
                <Shield className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">سياسة الخصوصية</h1>
                <p className="text-primary-600">آخر تحديث: 23 يوليو 2026</p>
              </div>
            </div>

            <div className="prose prose-lg prose-primary max-w-none text-primary-800 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">1. مقدمة</h2>
                <p className="leading-relaxed">
                  نحن في منصة توتيبا (Tutiba) نولي أهمية قصوى لخصوصية بياناتك. تشرح سياسة الخصوصية هذه كيف نقوم بجمع، واستخدام، وحماية معلوماتك الشخصية عند استخدامك لمنصتنا التعليمية المتخصصة في الكوسميسوتيكال.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">2. المعلومات التي نجمعها</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، وكلمة المرور المشفرة.</li>
                  <li><strong>بيانات الدفع:</strong> لا نقوم بتخزين بيانات بطاقات الائتمان مباشرة، بل نتعامل مع مزودي خدمات دفع موثوقين ومسجلين.</li>
                  <li><strong>بيانات التعلم:</strong> تقدمك في الكورسات، نتائج الاختبارات، والشهادات الصادرة.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">3. كيف نستخدم معلوماتك</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>تقديم المحتوى التعليمي وإصدار الشهادات المعتمدة.</li>
                  <li>تحسين تجربة المستخدم وتطوير محتوى المنصة.</li>
                  <li>التواصل معك بخصوص التحديثات الهامة أو الدعم الفني.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">4. أمن البيانات</h2>
                <p className="leading-relaxed">
                  نستخدم بروتوكولات التشفير القياسية (SSL/TLS) لحماية نقل البيانات. يتم تخزين بياناتك في خوادم سحابية مؤمنة بأحدث تقنيات الحماية القياسية المعتمدة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary-900 mb-4">5. حقوقك</h2>
                <p className="leading-relaxed">
                  يحق لك الوصول إلى بياناتك الشخصية، أو طلب تعديلها، أو حذفها في أي وقت عبر إعدادات حسابك أو بالتواصل مع فريق الدعم الفني الخاص بنا.
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

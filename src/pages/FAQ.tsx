import React, { useEffect } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';

export function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      q: "لمن موجهة كورسات المنصة؟",
      a: "كورساتنا مصممة خصيصاً للصيادلة، أطباء الجلدية، والممارسين الصحيين المهتمين بمجال الكوسميسوتيكال والعناية العلاجية بالبشرة والشعر."
    },
    {
      q: "هل الشهادات معتمدة؟",
      a: "نعم، نقدم شهادات إتمام موثقة برقم تعريفي فريد يمكن التحقق منه عبر منصتنا، وتعتبر إضافة قيمة لسيرتك الذاتية المهنية."
    },
    {
      q: "كيف يمكنني الدفع؟",
      a: "ندعم وسائل الدفع الإلكتروني المختلفة بما في ذلك البطاقات الائتمانية، مدى، وبوابات الدفع المحلية المعتمدة."
    },
    {
      q: "هل يمكنني الوصول للكورسات في أي وقت؟",
      a: "بمجرد اشتراكك في الكورس، يمكنك الوصول للمحتوى في أي وقت ومن أي جهاز، وتستمر صلاحية الوصول حسب خطة الاشتراك الموضحة في تفاصيل الكورس."
    }
  ];

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <MarketingNavbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-accent-600" />
            </div>
            <h1 className="text-4xl font-bold text-primary-900 mb-4">الأسئلة الشائعة</h1>
            <p className="text-xl text-primary-600">إجابات على استفساراتكم حول منصة توتيبا</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-2xl border border-primary-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-primary-900">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-primary-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-primary-600 leading-relaxed border-t border-primary-50 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

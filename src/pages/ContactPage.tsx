import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <MarketingNavbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
            
            {/* Contact Info */}
            <div>
              <h1 className="text-4xl font-bold text-primary-900 mb-4">تواصل معنا</h1>
              <p className="text-lg text-primary-600 mb-12 max-w-lg leading-relaxed">
                نحن هنا لمساعدتك والإجابة على كافة استفساراتك. لا تتردد في التواصل معنا عبر النموذج أو القنوات التالية.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">البريد الإلكتروني</h3>
                    <p className="text-primary-600 mb-2">للاستفسارات العامة والدعم الفني</p>
                    <a href="mailto:support@tutiba.com" className="font-bold text-accent-600 hover:text-accent-700" dir="ltr">support@tutiba.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">الهاتف / واتساب</h3>
                    <p className="text-primary-600 mb-2">من الأحد للخميس (9 ص - 5 م)</p>
                    <a href="tel:+20100000000" className="font-bold text-accent-600 hover:text-accent-700" dir="ltr">+20 100 000 0000</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">أرسل رسالة</h2>
              
              {isSuccess ? (
                <div className="bg-success-50 text-success-700 p-6 rounded-xl border border-success-200 text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">تم الإرسال بنجاح!</h3>
                  <p>سنقوم بالرد عليك في أقرب وقت ممكن.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">الاسم الكامل</label>
                      <input
                        type="text"
                        required
                        className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">رقم الهاتف</label>
                      <input
                        type="tel"
                        className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                        placeholder="اختياري"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                      placeholder="name@example.com"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">موضوع الرسالة</label>
                    <select className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors">
                      <option value="support">دعم فني</option>
                      <option value="billing">استفسار مالي / دفع</option>
                      <option value="course">سؤال عن الكورسات</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">نص الرسالة</label>
                    <textarea
                      required
                      rows={4}
                      className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors resize-none"
                      placeholder="كيف يمكننا مساعدتك؟"
                    ></textarea>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </Button>
                </form>
              )}
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

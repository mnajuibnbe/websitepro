import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail } from 'lucide-react';

export function Newsletter() {
  return (
    <section className="py-16 md:py-24 bg-accent-50 border-t border-accent-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 shadow-sm border border-accent-100 flex flex-col lg:flex-row items-center justify-between gap-12 hover:shadow-md transition-shadow duration-300">
          <div className="lg:w-1/2 text-center lg:text-right">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0">
              <Mail className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">
              احصلي على دروس علمية وتحديثات الكورسات
            </h2>
            <p className="text-primary-600 text-lg leading-relaxed">
              لا رسائل مزعجة، يمكنك إلغاء الاشتراك في أي وقت.
            </p>
          </div>
          <div className="lg:w-1/2 w-full max-w-md">
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex-grow">
                <Input 
                  type="email" 
                  placeholder="أدخلي بريدك الإلكتروني" 
                  className="w-full h-14 text-lg bg-primary-50 border-primary-200 focus:bg-white"
                  required
                  aria-label="البريد الإلكتروني"
                />
              </div>
              <Button variant="primary" className="h-14 px-8 text-lg whitespace-nowrap">
                اشتراك
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

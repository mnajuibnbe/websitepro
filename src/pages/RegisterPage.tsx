import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function RegisterPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. استخدام دالة التسجيل الخاصة بـ Supabase مع تمرير الاسم (full_name)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name // الاسم المأخوذ من حقل الاسم في النموذج
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // 2. تحديث الـ Context المحلي للمحافظة على واجهة المستخدم الحالية أثناء العرض
      await register(name, email, password);
      
      onNavigate('#/dashboard');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4 rtl" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">إنشاء حساب جديد</h1>
          <p className="text-primary-600">انضم لمنصة توتيبا التعليمية الآن</p>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">الاسم الكامل</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-primary-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full pr-11 pl-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="الاسم الثلاثي"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-primary-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pr-11 pl-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="name@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-primary-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pr-11 pl-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </form>

        <div className="mt-8 text-center text-primary-600">
          لديك حساب بالفعل؟{' '}
          <a 
            href="#/login" 
            onClick={(e) => {
              e.preventDefault();
              onNavigate('#/login');
            }}
            className="font-bold text-accent-600 hover:text-accent-700"
          >
            تسجيل الدخول
          </a>
        </div>
        
        <div className="mt-6 text-center">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('#/');
            }}
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </a>
        </div>
      </div>
    </div>
  );
}

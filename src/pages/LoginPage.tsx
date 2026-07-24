import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4 rtl" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">تسجيل الدخول</h1>
          <p className="text-primary-600">مرحباً بك مجدداً في منصة توتيبا</p>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-primary-900">كلمة المرور</label>
              <Link to="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-sm font-medium text-accent-600 hover:text-accent-700">نسيت كلمة المرور؟</Link>
            </div>
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
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-8 text-center text-primary-600">
          ليس لديك حساب؟{' '}
          <Link to="/register" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            className="font-bold text-accent-600 hover:text-accent-700"
          >
            إنشاء حساب جديد
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

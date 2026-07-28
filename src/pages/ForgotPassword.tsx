import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/update-password',
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError('Unable to send the password reset link. Please verify your email address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4" dir="ltr">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">Reset Password</h1>
          <p className="text-primary-600">Enter your email address and we will send you a secure reset link.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">Check Your Email</h3>
            <p className="text-primary-600 mb-8">
              Please ({email}) Password.
            </p>
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="w-full h-12 text-lg"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-primary-900 mb-2">Email Address</label>
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

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Link'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-900 transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

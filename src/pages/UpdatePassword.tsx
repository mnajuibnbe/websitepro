import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAndInitializeSession() {
      try {
        // 1. Check existing session first
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          if (isMounted) {
            setHasSession(true);
            setIsVerifyingSession(false);
          }
          return;
        }

        // 2. Listen to auth state changes in case Supabase is asynchronously parsing tokens in URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (session || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setHasSession(true);
            setIsVerifyingSession(false);
            setError(null);
          }
        });

        // 3. Fallback timer if session is not ready immediately
        const timer = setTimeout(async () => {
          if (!isMounted) return;
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setHasSession(true);
            setError(null);
          } else {
            setHasSession(false);
            setError('This reset link is invalid or has expired.');
          }
          setIsVerifyingSession(false);
        }, 3000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        if (isMounted) {
          setHasSession(false);
          setError('Error.');
          setIsVerifyingSession(false);
        }
      }
    }

    checkAndInitializeSession();

    if (window.location.hash.includes('access_token=')) {
      window.history.replaceState(null, '', window.location.pathname + '#/update-password');
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);

      // Verify session exists right before calling updateUser
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Unable to update your password. Please request a new reset link.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 font-sans" dir="ltr">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary-200 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-accent-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary-900 mb-2">Loading...</h3>
          <p className="text-sm text-primary-600">Please review the information and try again.</p>
        </div>
      </div>
    );
  }

  if (!hasSession && !success) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4 font-sans" dir="ltr">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8 text-center">
          <div className="w-12 h-12 bg-danger-100 text-danger-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">Password Updated</h2>
          <p className="text-primary-600 text-sm mb-6">
            {error || 'Password.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full py-3 px-4 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Link
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold rounded-xl transition-colors text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" dir="ltr">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-accent-600">
          <Lock className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-900">
          Password
        </h2>
        <p className="mt-2 text-center text-sm text-primary-600">
          Password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-primary-100">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">Password</h3>
              <p className="text-sm text-primary-500 mb-6">
                Sign In...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-primary-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pr-10 py-3 border border-primary-300 rounded-xl shadow-sm placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-shadow sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary-400 hover:text-primary-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full pr-10 py-3 border border-primary-300 rounded-xl shadow-sm placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-shadow sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Update...</span>
                    </>
                  ) : (
                    'Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}


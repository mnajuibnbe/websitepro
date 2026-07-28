import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      const from = (location.state as { from?: string | { pathname?: string } } | null)?.from;
      const destination = typeof from === 'string' ? from : from?.pathname;
      navigate(destination?.startsWith('/') ? destination : '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign In');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4" dir="ltr">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">Sign In</h1>
          <p className="text-primary-600">Welcome back. Sign in to continue learning.</p>
        </div>

        {error && (
          <div id="login-error" role="alert" className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold text-primary-900 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                id="login-email"
                autoComplete="email"
                aria-describedby={error ? 'login-error' : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="name@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="block text-sm font-bold text-primary-900">Password</label>
              <Link to="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-sm font-medium text-accent-600 hover:text-accent-700">Forgot Password</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                autoComplete="current-password"
                aria-describedby={error ? 'login-error' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-11 pr-12 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="••••••••"
                dir="ltr"
              />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex items-center px-4 text-primary-500 hover:text-primary-900">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Sign In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center text-primary-600">
          Don’t have an account?{' '}
          <Link to="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            className="font-bold text-accent-600 hover:text-accent-700"
          >
            Sign Up
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
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

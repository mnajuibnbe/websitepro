import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { resolveSafeReturnPath, type ReturnLocation } from '../lib/authRouting';

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
      const from = (location.state as { from?: string | ReturnLocation } | null)?.from;
      navigate(resolveSafeReturnPath(from), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not sign you in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in to Tutiba" description="Enter your details to continue your learning journey." eyebrow="Welcome back">
        {error && (
          <div id="login-error" role="alert" className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
          <AuthField id="login-email" type="email" label="Email address" autoComplete="email" aria-describedby={error ? 'login-error' : undefined} value={email} onChange={event => setEmail(event.target.value)} required disabled={isLoading} placeholder="name@example.com" dir="ltr" leadingIcon={<Mail className="h-5 w-5" />} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="block text-sm font-bold text-primary-900">Password</label>
              <Link to="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-sm font-medium text-accent-600 hover:text-accent-700">Forgot Password</Link>
            </div>
            <AuthField id="login-password" type={showPassword ? 'text' : 'password'} label="" aria-label="Password" autoComplete="current-password" aria-describedby={error ? 'login-error' : undefined} value={password} onChange={event => setPassword(event.target.value)} required disabled={isLoading} placeholder="••••••••" dir="ltr" leadingIcon={<Lock className="h-5 w-5" />} trailingAction={<button type="button" onClick={() => setShowPassword(value => !value)} disabled={isLoading} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="flex h-full min-w-11 items-center justify-center text-primary-500 hover:text-primary-900 disabled:opacity-50">{showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button>} />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
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
            Sign up
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
            <span>Back to Tutiba home</span>
          </Link>
        </div>
    </AuthLayout>
  );
}

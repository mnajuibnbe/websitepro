import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { User as UserIcon, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await register(name.trim(), email.trim(), password);

      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Account created. Check your email to confirm your address before signing in.');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4" dir="ltr">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-primary-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">Sign Up</h1>
          <p className="text-primary-600">Create your Tutiba account and start learning.</p>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl border border-danger-200 text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-success-50 text-success-700 px-4 py-3 rounded-xl border border-success-200 text-sm mb-6 font-medium text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="register-name" className="block text-sm font-bold text-primary-900 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                id="register-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="Enter your full name"
                disabled={!!successMessage}
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-bold text-primary-900 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                id="register-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="name@example.com"
                dir="ltr"
                disabled={!!successMessage}
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-bold text-primary-900 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full pl-11 pr-12 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                placeholder="••••••••"
                dir="ltr"
                disabled={!!successMessage}
              />
              <button type="button" onClick={() => setShowPassword(value => !value)} disabled={!!successMessage} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex items-center px-4 text-primary-500 hover:text-primary-900 disabled:opacity-50">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <p className="mt-2 text-xs text-primary-500">Use at least 8 characters. A longer, unique password is more secure.</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-lg"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? 'Create...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-8 text-center text-primary-600">
          Already have an account?{' '}
          <Link to="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="font-bold text-accent-600 hover:text-accent-700"
          >
            Sign In
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

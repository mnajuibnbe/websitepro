import React, { useState } from 'react';
import { useNavigate , Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await register(name.trim(), email.trim(), password);

      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Sign Up. Please review the information and try again.');
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
            <label className="block text-sm font-bold text-primary-900 mb-2">Full Name</label>
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
                placeholder="Enter details"
                disabled={!!successMessage}
              />
            </div>
          </div>

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
                disabled={!!successMessage}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">Password</label>
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
                disabled={!!successMessage}
              />
            </div>
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
          Details{' '}
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
            <ArrowRight className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

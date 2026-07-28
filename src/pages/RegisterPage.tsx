import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthField } from '../components/auth/AuthField';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await register(name.trim(), email.trim(), password);
      if (result.requiresEmailConfirmation) setSuccess(true);
      else navigate('/dashboard', { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We could not create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={success ? 'Confirm your email' : 'Create your Tutiba account'} description={success ? 'One more step is needed before you can start learning.' : 'Set up your account to enroll in courses and track your progress.'} eyebrow="Join Tutiba">
      {success ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" aria-hidden="true" />
          <p role="status" className="mb-2 text-primary-700">We sent a confirmation link to:</p>
          <p className="mb-3 break-all font-semibold text-primary-900">{email}</p>
          <p className="mb-7 text-sm leading-relaxed text-primary-500">Open the link in that email to activate your account. Check your spam folder if it does not arrive soon.</p>
          <div className="grid gap-3">
            <Button variant="secondary" className="w-full" onClick={() => setSuccess(false)}>Use a different email</Button>
            <Link to="/login" className="rounded-lg py-2 text-sm font-semibold text-accent-700 hover:text-accent-800">Continue to sign in</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-5">
          {error && <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">{error}</div>}
          <AuthField id="register-name" type="text" label="Full name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required disabled={isLoading} placeholder="Enter your full name" leadingIcon={<UserIcon className="h-5 w-5" />} />
          <AuthField id="register-email" type="email" label="Email address" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={isLoading} placeholder="name@example.com" dir="ltr" leadingIcon={<Mail className="h-5 w-5" />} />
          <AuthField id="register-password" type={showPassword ? 'text' : 'password'} label="Password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} disabled={isLoading} placeholder="••••••••" dir="ltr" hint="Use at least 8 characters. A longer, unique password is more secure." leadingIcon={<Lock className="h-5 w-5" />} trailingAction={<button type="button" onClick={() => setShowPassword(value => !value)} disabled={isLoading} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} className="flex h-full min-w-11 items-center justify-center text-primary-500 hover:text-primary-900 disabled:opacity-50">{showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button>} />
          <p className="text-xs leading-relaxed text-primary-500">By creating an account, you agree to the <Link to="/terms" className="font-semibold text-accent-700 hover:underline">Terms</Link> and acknowledge the <Link to="/privacy" className="font-semibold text-accent-700 hover:underline">Privacy Policy</Link>.</p>
          <Button type="submit" isLoading={isLoading} className="w-full">{isLoading ? 'Creating account…' : 'Create account'}</Button>
          <p className="text-center text-sm text-primary-600">Already have an account? <Link to="/login" className="font-bold text-accent-700 hover:text-accent-800">Sign in</Link></p>
        </form>
      )}
    </AuthLayout>
  );
}

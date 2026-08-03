import React, { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthField } from '../components/auth/AuthField';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { runAuthRequest } from '../lib/authAsync';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await runAuthRequest(supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/?type=recovery`,
      }));
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, 'recovery'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={success ? 'Check your email' : 'Reset your password'} description={success ? 'If an account matches that address, a secure reset link is on its way.' : 'Enter the email address connected to your Tutiba account.'} eyebrow="Account recovery">
      {success ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" aria-hidden="true" />
          <p role="status" className="mb-2 text-primary-700">Check your inbox and spam folder for the reset email.</p>
          <p className="mb-7 break-all text-sm text-primary-500">Request sent for <strong>{email}</strong></p>
          <div className="grid gap-3">
            <Button onClick={() => setSuccess(false)} variant="secondary" className="w-full">Try another email</Button>
            <Link to="/login" className="rounded-lg py-2 text-sm font-semibold text-accent-700 hover:text-accent-800">Back to sign in</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-6">
          {error && <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">{error}</div>}
          <AuthField id="recovery-email" type="email" label="Email address" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={isLoading} placeholder="name@example.com" dir="ltr" leadingIcon={<Mail className="h-5 w-5" />} />
          <Button type="submit" isLoading={isLoading} className="w-full">{isLoading ? 'Sending reset link…' : 'Send reset link'}</Button>
          <div className="text-center"><Link to="/login" className="text-sm font-semibold text-primary-600 hover:text-accent-700">Back to sign in</Link></div>
        </form>
      )}
    </AuthLayout>
  );
}

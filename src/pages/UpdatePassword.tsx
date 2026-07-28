import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { runAuthRequest } from '../lib/authAsync';

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
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasSession(true);
        setError(null);
        setIsVerifyingSession(false);
      }
    });

    async function verifyRecoverySession() {
      try {
        const { data: { session } } = await runAuthRequest(supabase.auth.getSession());
        if (!active) return;
        if (session) {
          setHasSession(true);
          setIsVerifyingSession(false);
          return;
        }

        timer = setTimeout(async () => {
          const { data: { session: delayedSession } } = await runAuthRequest(supabase.auth.getSession());
          if (!active) return;
          setHasSession(Boolean(delayedSession));
          setError(delayedSession ? null : 'This password reset link is invalid or has expired. Request a new link to continue.');
          setIsVerifyingSession(false);
        }, 3000);
      } catch {
        if (!active) return;
        setError('We could not verify this reset link. Please request a new one.');
        setIsVerifyingSession(false);
      }
    }

    void verifyRecoverySession();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await runAuthRequest(supabase.auth.getSession());
      if (!session) throw new Error('Your password reset link has expired. Request a new link to continue.');
      const { error: updateError } = await runAuthRequest(supabase.auth.updateUser({ password }));
      if (updateError) throw updateError;
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, 'password-update'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <AuthLayout title="Verifying your reset link" description="This should only take a moment.">
        <div role="status" aria-live="polite" className="py-8 text-center text-primary-600">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-accent-600" aria-hidden="true" />
          Securely verifying your request…
        </div>
      </AuthLayout>
    );
  }

  if (!hasSession) {
    return (
      <AuthLayout title="Reset link unavailable" description="For your security, password reset links can only be used once and expire after a limited time.">
        <div role="alert" className="mb-6 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          <AlertCircle className="mb-2 h-6 w-6" aria-hidden="true" />{error}
        </div>
        <div className="grid gap-3">
          <Button onClick={() => navigate('/forgot-password')} className="w-full">Request a new reset link</Button>
          <Button onClick={() => navigate('/login')} variant="secondary" className="w-full">Back to sign in</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={success ? 'Password updated' : 'Create a new password'} description={success ? 'Your new password is ready to use.' : 'Choose a strong, unique password for your Tutiba account.'}>
      {success ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" aria-hidden="true" />
          <p className="mb-6 text-primary-600" role="status">Your password was updated successfully. You can now sign in.</p>
          <Button onClick={() => navigate('/login')} className="w-full">Continue to sign in</Button>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} aria-busy={isLoading} className="space-y-5">
          {error && <div id="password-update-error" role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>}
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} show={showPassword} disabled={isLoading} describedBy={error ? 'password-update-error password-requirement' : 'password-requirement'} onToggle={() => setShowPassword(value => !value)} />
          <p id="password-requirement" className="-mt-3 text-xs text-primary-500">Use at least 8 characters. A longer, unique password is more secure.</p>
          <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} show={showPassword} disabled={isLoading} describedBy={error ? 'password-update-error' : undefined} />
          <Button type="submit" isLoading={isLoading} className="w-full">{isLoading ? 'Updating password…' : 'Update password'}</Button>
        </form>
      )}
    </AuthLayout>
  );
}

function PasswordField({ id, label, value, onChange, show, disabled, describedBy, onToggle }: { id: string; label: string; value: string; onChange: (value: string) => void; show: boolean; disabled: boolean; describedBy?: string; onToggle?: () => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-primary-900">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} aria-describedby={describedBy} className="block w-full rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 pr-12 focus:border-accent-500 focus:ring-2 focus:ring-accent-500 disabled:opacity-60" />
        {onToggle && <button type="button" onClick={onToggle} disabled={disabled} aria-pressed={show} aria-label={show ? 'Hide passwords' : 'Show passwords'} className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-primary-500 hover:text-primary-900 disabled:opacity-50">{show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button>}
      </div>
    </div>
  );
}

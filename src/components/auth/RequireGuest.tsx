import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SessionRecovery } from './SessionRecovery';

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, sessionError, retrySession } = useAuth();

  if (isLoading) {
    return <main role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-primary-50"><Loader2 className="h-10 w-10 animate-spin text-accent-600" aria-hidden="true" /><span className="sr-only">Checking your account</span></main>;
  }
  if (sessionError) return <SessionRecovery message={sessionError} onRetry={retrySession} />;
  if (isAuthenticated) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <>{children}</>;
}

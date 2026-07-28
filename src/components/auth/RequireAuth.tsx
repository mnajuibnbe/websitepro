import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Permission } from '../../types/auth';
import { Loader2 } from 'lucide-react';
import { SessionRecovery } from './SessionRecovery';

interface RequireAuthProps {
  children: React.ReactNode;
  permission?: Permission;
}

export function RequireAuth({ children, permission }: RequireAuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, sessionError, retrySession } = useAuth();
  const { hasPermission } = useAuthorization();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !sessionError) {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: location }, replace: true });
      } else if (permission && !hasPermission(permission)) {
        navigate('/unauthorized', { replace: true });
      } else {
        setIsReady(true);
      }
    }
  }, [isAuthenticated, isLoading, sessionError, permission, hasPermission, navigate, location]);

  if (sessionError) return <SessionRecovery message={sessionError} onRetry={retrySession} />;

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-600 animate-spin mb-4" />
        <p className="text-primary-600 font-medium">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

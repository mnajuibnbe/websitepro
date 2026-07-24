import React from 'react';
import { Permission } from '../../types/auth';
import { useAuthorization } from '../../hooks/useAuthorization';

interface RequirePermissionProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export function RequirePermission({ children, permission, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = useAuthorization();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

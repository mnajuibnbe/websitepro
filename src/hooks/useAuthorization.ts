import { useAuth } from '../contexts/AuthContext';
import { Role, Permission } from '../types/auth';
import { PERMISSIONS } from '../auth/permissions';

export function useAuthorization() {
  const { user } = useAuth();
  const role: Role = user?.role || 'student';

  const hasRole = (requiredRole: Role) => {
    return role === requiredRole;
  };

  const hasPermission = (permission: Permission) => {
    const userPermissions = PERMISSIONS[role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]) => {
    const userPermissions = PERMISSIONS[role] || [];
    return permissions.some(p => userPermissions.includes(p));
  };

  const hasAllPermissions = (permissions: Permission[]) => {
    const userPermissions = PERMISSIONS[role] || [];
    return permissions.every(p => userPermissions.includes(p));
  };

  return {
    role,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

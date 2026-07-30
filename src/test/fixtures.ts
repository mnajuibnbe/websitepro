import type { AuthContextType } from '../contexts/AuthContext';

export const mobileViewports = {
  compactPortrait: { width: 320, height: 568 },
  androidPortrait: { width: 360, height: 640 },
  compactLandscape: { width: 568, height: 320 },
} as const;

export const testUsers = {
  student: {
    id: 'student-test-id',
    email: 'student@example.test',
    name: 'Test Student',
    role: 'student' as const,
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  admin: {
    id: 'admin-test-id',
    email: 'admin@example.test',
    name: 'Test Admin',
    role: 'admin' as const,
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
} as const;

export function createTestAuthValue(
  role: keyof typeof testUsers = 'student',
  overrides: Partial<AuthContextType> = {},
): AuthContextType {
  return {
    user: testUsers[role],
    session: null,
    token: null,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    retrySession: async () => {},
    refreshSession: async () => {},
    login: async () => {},
    register: async () => ({ user: testUsers[role], session: null, requiresEmailConfirmation: false }),
    logout: async () => true,
    ...overrides,
  };
}

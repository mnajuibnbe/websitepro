type AuthOperation = 'login' | 'register' | 'recovery' | 'password-update';

export function getAuthErrorMessage(error: unknown, operation: AuthOperation) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : undefined;

  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (message.includes('invalid login credentials')) return 'Incorrect email address or password.';
  if (message.includes('email not confirmed')) return 'Confirm your email address before signing in.';
  if (message.includes('already registered') || message.includes('already exists')) return 'An account with this email address already exists.';
  if (message.includes('network') || message.includes('fetch')) return 'We could not reach the authentication service. Check your connection and try again.';
  if (message.includes('expired') || message.includes('invalid token')) return 'This secure link is invalid or has expired. Request a new link to continue.';

  const fallbacks: Record<AuthOperation, string> = {
    login: 'We could not sign you in. Please try again.',
    register: 'We could not create your account. Please try again.',
    recovery: 'We could not send a reset link right now. Please try again shortly.',
    'password-update': 'We could not update your password. Please request a new link or try again.',
  };
  return fallbacks[operation];
}

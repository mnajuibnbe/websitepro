const guestOnlyRoutes = new Set(['/login', '/register', '/forgot-password']);

export interface ReturnLocation {
  pathname?: string;
  search?: string;
  hash?: string;
}

export function resolveSafeReturnPath(value: string | ReturnLocation | null | undefined, fallback = '/dashboard') {
  const candidate = typeof value === 'string'
    ? value
    : value?.pathname
      ? `${value.pathname}${value.search ?? ''}${value.hash ?? ''}`
      : '';

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return fallback;

  try {
    const parsed = new URL(candidate, 'https://tutiba.invalid');
    if (parsed.origin !== 'https://tutiba.invalid') return fallback;
    if (guestOnlyRoutes.has(parsed.pathname) || parsed.pathname === '/update-password') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

const DEFAULT_AUTH_TIMEOUT_MS = 15_000;

export async function runAuthRequest<T>(request: Promise<T>, timeoutMs = DEFAULT_AUTH_TIMEOUT_MS): Promise<T> {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You appear to be offline. Check your connection and try again.');
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('The authentication service took too long to respond. Please try again.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

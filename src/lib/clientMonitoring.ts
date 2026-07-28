export interface ClientErrorReport { message: string; stack?: string; context?: string; path: string; userAgent: string; }

export function reportClientError(error: unknown, context?: string) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const report: ClientErrorReport = {
    message: normalized.message.slice(0, 500),
    stack: normalized.stack?.slice(0, 4000),
    context,
    path: `${location.pathname}${location.hash}`.slice(0, 500),
    userAgent: navigator.userAgent.slice(0, 500),
  };
  const body = JSON.stringify(report);
  if (!navigator.sendBeacon?.('/api/client-errors', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
  }
}

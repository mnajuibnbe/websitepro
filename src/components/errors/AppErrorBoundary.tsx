import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../../lib/clientMonitoring';

interface AppErrorBoundaryProps { children?: ReactNode }
interface AppErrorBoundaryState { failed: boolean }
const TypedComponent = Component as unknown as {
  new <P, S>(props: P): { readonly props: Readonly<P>; state: S; context: unknown; setState(state: Partial<S>): void; forceUpdate(): void; render(): ReactNode };
};

export class AppErrorBoundary extends TypedComponent<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, info.componentStack || 'React render');
    // Dynamic import: keeps the Sentry SDK out of the initial bundle graph —
    // it's only fetched on the rare path where a render actually crashed.
    import('../../lib/sentry').then(({ Sentry }) => {
      Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack || 'React render' } } });
    });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="flex min-h-screen items-center justify-center bg-primary-50 p-6"><section className="w-full max-w-lg rounded-2xl border border-danger-200 bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-danger-600">Application error</p><h1 className="mt-2 text-2xl font-bold text-primary-900">Something went wrong</h1><p className="mt-3 text-primary-600">The issue was reported. Reload the page to try again.</p><button type="button" onClick={() => location.reload()} className="mt-6 rounded-lg bg-primary-900 px-5 py-3 font-semibold text-white">Reload page</button></section></main>;
  }
}

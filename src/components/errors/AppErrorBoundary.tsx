import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../../lib/clientMonitoring';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  declare readonly props: Readonly<{ children: ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { reportClientError(error, info.componentStack || 'React render'); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="flex min-h-screen items-center justify-center bg-primary-50 p-6"><section className="w-full max-w-lg rounded-2xl border border-danger-200 bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-danger-600">Application error</p><h1 className="mt-2 text-2xl font-bold text-primary-900">Something went wrong</h1><p className="mt-3 text-primary-600">The issue was reported. Reload the page to try again.</p><button type="button" onClick={() => location.reload()} className="mt-6 rounded-lg bg-primary-900 px-5 py-3 font-semibold text-white">Reload page</button></section></main>;
  }
}

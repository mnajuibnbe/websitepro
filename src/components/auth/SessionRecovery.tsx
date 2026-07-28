import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function SessionRecovery({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-primary-50 p-4">
      <section role="alert" aria-labelledby="session-error-title" className="w-full max-w-md rounded-2xl border border-primary-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-danger-500" aria-hidden="true" />
        <h1 id="session-error-title" className="text-xl font-bold text-primary-900">Unable to verify your session</h1>
        <p className="mt-3 text-primary-600">{message}</p>
        <Button type="button" className="mt-6 w-full" onClick={() => void onRetry()}>Try again</Button>
      </section>
    </main>
  );
}

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3 max-w-sm w-full" dir="ltr">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-lg border flex items-start justify-between gap-3 transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-success-50 border-success-200 text-success-900'
              : toast.type === 'error'
              ? 'bg-danger-50 border-danger-200 text-danger-900'
              : 'bg-primary-50 border-primary-200 text-primary-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />}
            <span className="text-sm font-bold leading-relaxed">{toast.message}</span>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="flex min-h-11 min-w-11 flex-shrink-0 -m-3 items-center justify-center text-primary-400 hover:text-primary-700 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-4" onMouseDown={event => event.target === event.currentTarget && !busy && onCancel()}>
    <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600"><AlertTriangle className="h-6 w-6" /></div>
      <h2 id="confirm-title" className="text-xl font-bold text-primary-900">{title}</h2>
      <p id="confirm-description" className="mt-2 leading-relaxed text-primary-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-primary-200 px-4 py-2.5 font-semibold text-primary-700">Cancel</button><button type="button" disabled={busy} onClick={onConfirm} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg bg-danger-600 px-4 py-2.5 font-semibold text-white hover:bg-danger-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}</button></div>
    </div>
  </div>;
}

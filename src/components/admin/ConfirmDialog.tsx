import { ReactNode, useEffect, useId, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean; title: string; description: string; confirmLabel?: string; busy?: boolean;
  confirmTone?: 'danger' | 'primary'; cancelLabel?: string; children?: ReactNode; onConfirm: () => void; onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', confirmTone = 'danger', cancelLabel = 'Cancel', busy = false, children, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => cancelRef.current?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href]')) as HTMLElement[];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [open, busy, onCancel]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-4" onMouseDown={event => event.target === event.currentTarget && !busy && onCancel()}>
    <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmTone === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-amber-50 text-amber-700'}`}><AlertTriangle className="h-6 w-6" /></div>
      <h2 id={titleId} className="text-xl font-bold text-primary-900">{title}</h2>
      <p id={descriptionId} className="mt-2 leading-relaxed text-primary-600">{description}</p>
      {children}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-lg border border-primary-200 px-4 py-2.5 font-semibold text-primary-700 focus:ring-2 focus:ring-primary-500">{cancelLabel}</button><button type="button" disabled={busy} onClick={onConfirm} className={`inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-60 ${confirmTone === 'danger' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-900 hover:bg-primary-800'}`}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}</button></div>
    </div>
  </div>;
}

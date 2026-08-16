import { useEffect, useRef } from 'react';

/**
 * Focus trap + Escape-to-close + scroll lock, shared by the block editor's small dialogs
 * (media URL, link picker).
 *
 * `onClose` is read through a ref, not a hook dependency. Callers pass an inline arrow
 * (`onClose={() => setX(null)}`), so its identity is new on every parent render — and
 * these dialog components are always mounted in the JSX tree (they self-gate on `isOpen`
 * internally), so they re-render every time their parent does, `isOpen` or not. Putting
 * `onClose` in the effect's deps meant every parent re-render tore down and rebuilt the
 * focus trap while the dialog was open, which calls `previouslyFocused?.focus()` on
 * teardown. When `previouslyFocused` is the Tiptap editor, that `.focus()` fires a DOM
 * `selectionchange`, which ProseMirror turns into a transaction, which (via `useEditor`'s
 * default rerender-on-transaction behavior) re-renders the parent — producing a new
 * `onClose`, retriggering this effect, refocusing the editor, ad infinitum. That is the
 * exact "Insert image" infinite-loop crash (Sentry event 6b1987cb94964a81917a2521edd3ed0e):
 * depending only on `isOpen` breaks the cycle since the trap now sets up once per open.
 */
export function useDialogA11y(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstField = dialogRef.current?.querySelector<HTMLElement>('input, textarea, select, button:not([data-dialog-close])');
    firstField?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onCloseRef.current(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); previouslyFocused?.focus(); };
  }, [isOpen]);

  return dialogRef;
}

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SecureStreamProvider } from './SecureStreamProvider';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: string;
  asset?: 'homepage-intro';
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function IntroVideoModal({
  isOpen,
  onClose,
  lessonId,
  asset,
  eyebrow = 'Welcome to Tutiba',
  title = 'Discover the Tutiba learning experience',
  description = 'Meet our diploma pathway and hear directly from Tutiba students.',
}: IntroVideoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], video, [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-primary-900/85 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="secure-video-title" aria-describedby="secure-video-description" className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-primary-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex flex-none items-start justify-between gap-3 border-b border-primary-100 px-4 py-3 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">{eyebrow}</p>
            <h2 id="secure-video-title" className="text-lg font-bold text-primary-900 sm:text-xl">{title}</h2>
            <p id="secure-video-description" className="mt-1 text-sm text-primary-500">{description}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close introduction video" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-primary-500 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto bg-primary-900 p-0 sm:bg-white sm:p-6">
          {lessonId || asset
            ? asset
              ? <SecureStreamProvider asset={asset} publicPreview autoPlay title={title} />
              : <SecureStreamProvider lessonId={lessonId!} publicPreview autoPlay title={title} />
            : <div className="flex aspect-video items-center justify-center bg-primary-900 p-8 text-center text-primary-200">A free preview lesson is not available yet.</div>}
        </div>
        <footer className="flex flex-none justify-end border-t border-primary-100 bg-white p-3 sm:hidden">
          <button type="button" onClick={onClose} className="min-h-11 w-full rounded-xl bg-primary-100 px-5 font-bold text-primary-900">Close video</button>
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { detectBlogVideoProvider, type BlogVideoUrlProvider } from '../../domain/videoUrl';
import { useDialogA11y } from './useDialogA11y';

interface MediaUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kind: 'image' | 'video';
  onConfirmImage?: (result: { src: string; alt: string }) => void;
  onConfirmVideo?: (result: { provider: BlogVideoUrlProvider; url: string }) => void;
  initialSrc?: string;
  initialAlt?: string;
}

export function MediaUrlDialog({ isOpen, onClose, kind, onConfirmImage, onConfirmVideo, initialSrc = '', initialAlt = '' }: MediaUrlDialogProps) {
  const [url, setUrl] = useState(initialSrc);
  const [alt, setAlt] = useState(initialAlt);
  const [error, setError] = useState('');
  const dialogRef = useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setUrl(initialSrc);
    setAlt(initialAlt);
    setError('');
  }, [isOpen, initialSrc, initialAlt]);

  if (!isOpen) return null;

  const detectedProvider = kind === 'video' ? detectBlogVideoProvider(url) : null;

  const confirm = () => {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) { setError('Enter a full URL starting with https://'); return; }
    if (kind === 'image') {
      if (!alt.trim()) { setError('Add alt text describing the image — Google uses it to understand the image and it helps readers using a screen reader.'); return; }
      onConfirmImage?.({ src: trimmed, alt: alt.trim() });
      return;
    }
    if (!detectedProvider) { setError('This URL is not a recognized YouTube or Google Drive video link.'); return; }
    onConfirmVideo?.({ provider: detectedProvider, url: trimmed });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="media-url-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-primary-100 p-4">
          <h2 id="media-url-title" className="flex items-center gap-2 text-lg font-bold text-primary-900">
            {kind === 'image' ? <ImageIcon className="h-5 w-5 text-accent-600" /> : <VideoIcon className="h-5 w-5 text-accent-600" />}
            {kind === 'image' ? 'Insert image' : 'Insert video'}
          </h2>
          <button type="button" data-dialog-close onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-100"><X className="h-4 w-4" /></button>
        </header>
        <div className="space-y-3 p-4">
          <label className="block text-sm font-bold text-primary-800">{kind === 'image' ? 'Image URL' : 'YouTube or Google Drive URL'}
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={kind === 'image' ? 'https://example.com/image.jpg' : 'https://youtu.be/… or https://drive.google.com/file/d/…'} className="mt-1.5 min-h-11 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-normal outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
          </label>
          {kind === 'image' ? (
            <label className="block text-sm font-bold text-primary-800">Alt text
              <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the image shows" className="mt-1.5 min-h-11 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-normal outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
            </label>
          ) : detectedProvider && (
            <p className="rounded-lg bg-success-50 px-3 py-2 text-sm font-medium text-success-700">Detected: {detectedProvider === 'youtube' ? 'YouTube' : 'Google Drive'} video</p>
          )}
          {error && <p role="alert" className="rounded-lg bg-danger-50 p-2.5 text-sm text-danger-700">{error}</p>}
          <button type="button" onClick={confirm} className="min-h-11 w-full rounded-xl bg-accent-600 px-4 text-sm font-bold text-white hover:bg-accent-700">Insert</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SecureStreamProvider } from '../video/SecureStreamProvider';
import { VideoProviderResolver } from '../video/VideoProviderResolver';

export interface CoursePreviewLesson { lesson_id: string; lesson_title: string; video_url: string; }

function provider(url: string) {
  if (/drive\.google\.com/i.test(url)) return 'google_drive';
  if (/youtu(?:\.be|be\.com)/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'mp4';
}

export function CourseMediaLightbox({ open, onClose, courseId, courseTitle, trailerUrl, previewLesson, poster }: { open: boolean; onClose: () => void; courseId: string; courseTitle: string; trailerUrl: string | null; previewLesson: CoursePreviewLesson | null; poster?: string; }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeRef.current?.focus(); const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose(); window.addEventListener('keydown', key); return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', key); }; }, [open, onClose]);
  if (!open) return null;
  const trailer = trailerUrl?.trim() || '';
  const title = trailer ? `${courseTitle} trailer` : previewLesson?.lesson_title || `${courseTitle} preview`;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/90 p-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-5xl overflow-hidden rounded-2xl border border-primary-700 bg-primary-900 shadow-2xl"><header className="flex items-center justify-between gap-4 border-b border-primary-800 px-4 py-3 text-white"><div><p className="text-xs font-bold uppercase tracking-eyebrow text-accent-300">{trailer ? 'Course trailer' : 'Preview'}</p><h2 className="text-lg font-bold sm:text-xl">{title}</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close video" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-400"><X className="h-5 w-5" /></button></header><div className="bg-black">{trailer ? provider(trailer) === 'google_drive' ? <SecureStreamProvider asset="course-trailer" courseId={courseId} publicPreview autoPlay title={title} poster={poster} /> : <VideoProviderResolver lessonId={courseId} videoUrl={trailer} provider={provider(trailer)} title={title} poster={poster} publicPreview /> : previewLesson ? <VideoProviderResolver lessonId={previewLesson.lesson_id} videoUrl={previewLesson.video_url} provider={provider(previewLesson.video_url)} title={title} poster={poster} publicPreview /> : null}</div></div></div>;
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ExternalLink, FileText, HelpCircle, Video, X } from 'lucide-react';
import type { LessonContentType } from '../../../domain/courseAuthoring';

interface AddCurriculumItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  sectionId: string;
  sectionTitle?: string;
}

const lessonTypes: Array<{
  id: LessonContentType;
  label: string;
  description: string;
  icon: typeof Video;
  color: string;
}> = [
  { id: 'video', label: 'Video lesson', description: 'YouTube, Vimeo, Google Drive video file, MP4, or HLS.', icon: Video, color: 'border-amber-200 bg-amber-50 text-amber-700' },
  { id: 'pdf', label: 'PDF document', description: 'Upload or link a PDF learning resource.', icon: FileText, color: 'border-red-200 bg-red-50 text-red-700' },
  { id: 'external_link', label: 'External link', description: 'Link to an approved external learning resource.', icon: ExternalLink, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { id: 'quiz', label: 'Quiz', description: 'Build questions, answers, passing score, and retry rules.', icon: HelpCircle, color: 'border-violet-200 bg-violet-50 text-violet-700' },
  { id: 'assignment', label: 'Assignment', description: 'Add instructions and collect student work.', icon: ClipboardCheck, color: 'border-teal-200 bg-teal-50 text-teal-700' },
];

export function AddCurriculumItemDialog({ isOpen, onClose, courseId, sectionId, sectionTitle }: AddCurriculumItemDialogProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable: HTMLElement[] = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); previouslyFocused?.focus(); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const selectType = (type: LessonContentType) => {
    onClose();
    navigate(`/admin/courses/${courseId}/lessons/new?sectionId=${encodeURIComponent(sectionId)}&type=${type}`);
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-950/60 p-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-lesson-title" aria-describedby="add-lesson-description" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-primary-100 p-5 sm:p-6">
        <div><p className="text-sm font-bold text-amber-700">Add lesson to {sectionTitle || 'selected section'}</p><h2 id="add-lesson-title" className="mt-1 text-2xl font-bold text-primary-900">Choose a lesson type</h2><p id="add-lesson-description" className="mt-1 text-sm text-primary-600">Select the learning activity you want to create.</p></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close add lesson dialog" className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-primary-500 hover:bg-primary-100 hover:text-primary-900"><X className="h-5 w-5" /></button>
      </header>
      <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
        {lessonTypes.map(({ id, label, description, icon: Icon, color }) => <button key={id} type="button" onClick={() => selectType(id)} className="group flex min-h-28 items-start gap-4 rounded-2xl border border-primary-200 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl border ${color}`}><Icon className="h-5 w-5" /></span>
          <span><span className="block font-bold text-primary-900 group-hover:text-amber-900">{label}</span><span className="mt-1 block text-sm leading-relaxed text-primary-600">{description}</span></span>
        </button>)}
      </div>
      <footer className="flex justify-end border-t border-primary-100 p-4 sm:px-6"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-primary-200 px-5 font-bold text-primary-800 hover:bg-primary-50">Cancel</button></footer>
    </div>
  </div>;
}

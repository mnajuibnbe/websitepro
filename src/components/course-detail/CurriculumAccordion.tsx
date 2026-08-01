import { lazy, Suspense, useEffect, useState } from 'react';
import { ChevronDown, FileText, HelpCircle, Link as LinkIcon, Lock, PlayCircle, Video, ClipboardCheck, X } from 'lucide-react';
import type { LessonContentType } from '../../domain/courseAuthoring';

const PreviewVideoRenderer = lazy(() => import('../player/VideoLessonRenderer').then(module => ({ default: module.VideoLessonRenderer })));

export interface PublicCurriculumLesson {
  id: string;
  title: string;
  content_type: LessonContentType;
  estimated_minutes: number | null;
  is_preview: boolean;
  video_url?: string | null;
  video_provider?: string | null;
  order_index: number;
}

export interface PublicCurriculumSection {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lesson_count: number;
  total_minutes: number;
  lessons: PublicCurriculumLesson[];
}

const typeIcon = (type: LessonContentType) => {
  if (type === 'video') return Video;
  if (type === 'quiz') return HelpCircle;
  if (type === 'assignment') return ClipboardCheck;
  if (type === 'external_link') return LinkIcon;
  return FileText;
};

const minutesLabel = (minutes: number) => minutes > 0 ? `${minutes} min` : null;

export function CurriculumAccordion({ sections }: { sections: PublicCurriculumSection[] }) {
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id || null);
  const [previewLesson, setPreviewLesson] = useState<PublicCurriculumLesson | null>(null);
  useEffect(() => { if (!openSection && sections[0]) setOpenSection(sections[0].id); }, [openSection, sections]);
  const lessonCount = sections.reduce((total, section) => total + Number(section.lesson_count || 0), 0);
  const totalMinutes = sections.reduce((total, section) => total + Number(section.total_minutes || 0), 0);

  return <section className="mb-12 md:mb-16" aria-labelledby="curriculum-heading">
    <div className="mb-6">
      <h2 id="curriculum-heading" className="mb-2 text-2xl font-bold text-primary-900 md:text-3xl">Course curriculum</h2>
      <p className="font-medium text-primary-600">{sections.length} sections · {lessonCount} lessons{totalMinutes > 0 ? ` · ${totalMinutes} min of video` : ''}</p>
    </div>
    {sections.length === 0 ? <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 text-primary-600">Curriculum details will be available soon.</div> :
      <div className="overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
        {sections.map((section, index) => {
          const open = openSection === section.id;
          return <div key={section.id} className={index < sections.length - 1 ? 'border-b border-primary-200' : ''}>
            <button type="button" aria-expanded={open} aria-controls={`curriculum-${section.id}`} onClick={() => setOpenSection(open ? null : section.id)} className="flex min-h-16 w-full items-center justify-between gap-4 bg-primary-50 p-5 text-left transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500 md:p-6">
              <span><span className="block text-lg font-bold text-primary-900">{section.title}</span><span className="mt-1 block text-sm font-medium text-primary-500">{section.lesson_count} lessons{Number(section.total_minutes) > 0 ? ` · ${section.total_minutes} min` : ''}</span></span>
              <ChevronDown aria-hidden="true" className={`h-5 w-5 flex-none text-primary-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div id={`curriculum-${section.id}`} className="p-2 md:p-4">
              {section.description && <p className="px-3 pb-3 text-sm text-primary-600">{section.description}</p>}
              {section.lessons.map(lesson => { const Icon = typeIcon(lesson.content_type); return <div key={lesson.id} className="flex min-h-14 items-center justify-between gap-4 rounded-lg p-3 hover:bg-primary-50 md:p-4">
                <span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-100 text-primary-600"><Icon className="h-4 w-4" aria-hidden="true" /></span><span className="break-words font-medium text-primary-800">{lesson.title}</span></span>
                <span className="flex flex-none items-center gap-3 text-sm text-primary-500">{minutesLabel(Number(lesson.estimated_minutes || 0)) && <span>{minutesLabel(Number(lesson.estimated_minutes))}</span>}{lesson.is_preview && lesson.video_url ? <button type="button" onClick={() => setPreviewLesson(lesson)} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-bold text-accent-700 hover:bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-500"><PlayCircle className="h-4 w-4" /> Free preview</button> : lesson.is_preview ? <span className="font-bold text-primary-500">Preview unavailable</span> : <Lock className="h-4 w-4" aria-label="Enrollment required" />}</span>
              </div>; })}
            </div>}
          </div>;
        })}
      </div>}
    {previewLesson && <div role="dialog" aria-modal="true" aria-labelledby="preview-lesson-title" className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/80 p-4" onClick={() => setPreviewLesson(null)}>
      <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl md:p-6" onClick={event => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-accent-700">Free preview lesson</p><h2 id="preview-lesson-title" className="text-xl font-bold text-primary-900">{previewLesson.title}</h2></div><button type="button" onClick={() => setPreviewLesson(null)} aria-label="Close preview" className="flex h-11 w-11 items-center justify-center rounded-full text-primary-500 hover:bg-primary-100 focus:ring-2 focus:ring-accent-500"><X className="h-5 w-5" /></button></div>
        <Suspense fallback={<div className="flex aspect-video items-center justify-center rounded-2xl bg-primary-950 text-white">Loading preview…</div>}><PreviewVideoRenderer lessonId={previewLesson.id} videoUrl={previewLesson.video_url || null} title={previewLesson.title} publicPreview /></Suspense>
      </div>
    </div>}
  </section>;
}

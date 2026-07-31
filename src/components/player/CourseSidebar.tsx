import React, { useState, useEffect } from 'react';
import { CheckCircle2, PlayCircle, MonitorPlay, FileText, ChevronDown, Circle } from 'lucide-react';
import { CourseSection, Lesson } from '../../types/database.types';

interface CourseSidebarProps {
  sections: CourseSection[];
  lessons: Lesson[];
  completedLessonIds: string[];
  currentLessonId: string | null;
  courseId: string;
  progressPercentage: number;
  onLessonSelect: (lesson: Lesson) => void;
}

export function CourseSidebar({
  sections,
  lessons,
  completedLessonIds,
  currentLessonId,
  progressPercentage,
  onLessonSelect,
}: CourseSidebarProps) {
  // Determine which section contains current lesson by default
  const initialOpenSectionId = React.useMemo(() => {
    if (!currentLessonId) return sections[0]?.id || null;
    const currentLesson = lessons.find((l) => l.id === currentLessonId);
    return currentLesson?.section_id || sections[0]?.id || null;
  }, [currentLessonId, lessons, sections]);

  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialOpenSectionId && !openSectionIds.includes(initialOpenSectionId)) {
      setOpenSectionIds((prev) => Array.from(new Set([...prev, initialOpenSectionId])));
    }
  }, [initialOpenSectionId]);

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(id) ? prev.filter((secId) => secId !== id) : [...prev, id]
    );
  };

  // Group lessons by section
  const sectionLessonMap = React.useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    sections.forEach((sec) => {
      map[sec.id] = lessons.filter((l) => l.section_id === sec.id).sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id));
    });
    return map;
  }, [sections, lessons]);

  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => completedLessonIds.includes(l.id)).length;

  return (
    <div className="bg-white border border-primary-200 rounded-2xl flex flex-col h-full max-h-[800px] shadow-sm text-left" dir="ltr">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-primary-200 bg-primary-50/50 rounded-t-2xl">
        <h2 className="font-bold text-primary-900 mb-2 text-base">Course</h2>
        <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
        <p className="text-xs text-primary-600 font-semibold mt-2.5 flex items-center justify-between">
          <span>Course Progress</span>
          <span>
            {completedCount} Details {totalLessons} Lessons ({progressPercentage}%)
          </span>
        </p>
      </div>

      {/* Curriculum list */}
      <div className="overflow-y-auto flex-grow divide-y divide-primary-100">
        {sections.length === 0 ? (
          <div className="p-6 text-center text-primary-500 text-sm">
            No items are available yet..
          </div>
        ) : (
          sections.map((section) => {
            const sectionLessons = sectionLessonMap[section.id] || [];
            const secCompletedCount = sectionLessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;
            const isOpen = openSectionIds.includes(section.id);

            return (
              <div key={section.id} className="transition-colors">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 min-h-[48px] hover:bg-primary-50/80 transition-colors focus:outline-none text-left"
                >
                  <div className="flex flex-col items-start gap-1 text-left max-w-[85%]">
                    <span className={`font-bold text-sm leading-snug ${isOpen ? 'text-primary-900' : 'text-primary-800'}`}>
                      {section.title}
                    </span>
                    <span className="text-xs text-primary-500 font-medium">
                      {secCompletedCount} / {sectionLessons.length} Completed
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-primary-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-accent-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="bg-primary-50/40 pb-2 border-t border-primary-100">
                    {sectionLessons.length === 0 ? (
                      <div className="p-3 px-4 text-xs text-primary-400">No items are available yet..</div>
                    ) : (
                      sectionLessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;
                        const isCompleted = completedLessonIds.includes(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onLessonSelect(lesson)}
                            className={`w-full flex items-start gap-3 p-3 px-4 min-h-[48px] transition-all text-left group ${
                              isCurrent
                                ? 'bg-accent-50/90 border-r-4 border-accent-600 shadow-inner'
                                : 'border-r-4 border-transparent hover:bg-white'
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-success-600" />
                              ) : isCurrent ? (
                                <PlayCircle className="w-5 h-5 text-accent-600 animate-pulse" />
                              ) : (
                                <Circle className="w-5 h-5 text-primary-300 group-hover:text-primary-400" />
                              )}
                            </div>

                            <div className="flex flex-col flex-grow min-w-0">
                              <span
                                className={`text-sm leading-snug mb-1 truncate ${
                                  isCurrent
                                    ? 'font-bold text-accent-950'
                                    : isCompleted
                                    ? 'font-medium text-primary-700'
                                    : 'font-medium text-primary-800'
                                }`}
                              >
                                {lesson.title}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-primary-500 font-medium">
                                {lesson.type === 'video' ? (
                                  <MonitorPlay className="w-3.5 h-3.5 text-primary-400" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-primary-400" />
                                )}
                                <span>{lesson.duration || (lesson.type === 'video' ? 'Video lesson' : 'Content')}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

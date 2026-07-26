import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Video,
  FileText,
  FileCode,
  Volume2,
  Code,
  ExternalLink,
  Radio,
  HelpCircle,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

interface AddCurriculumItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  sectionId: string;
  sectionTitle?: string;
}

export function AddCurriculumItemDialog({
  isOpen,
  onClose,
  courseId,
  sectionId,
  sectionTitle,
}: AddCurriculumItemDialogProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const itemOptions = [
    {
      id: 'video',
      label: 'Lesson',
      description: 'Link YouTube / Vimeo / HLS',
      icon: Video,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      type: 'video',
      disabled: false,
    },
    {
      id: 'article',
      label: 'Lesson / Curriculum Item',
      description: 'Content HTML Curriculum Item Markdown',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      type: 'article',
      disabled: false,
    },
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Curriculum Item',
      icon: FileCode,
      color: 'bg-red-50 text-red-600 border-red-200',
      type: 'pdf',
      disabled: false,
    },
    {
      id: 'audio',
      label: 'Curriculum Item / Curriculum Item',
      description: 'Curriculum Item MP3 Curriculum Item',
      icon: Volume2,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      type: 'audio',
      disabled: false,
    },
    {
      id: 'embed',
      label: 'Content (Embed)',
      description: 'Curriculum Item iFrame Curriculum Item',
      icon: Code,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      type: 'embed',
      disabled: false,
    },
    {
      id: 'external_link',
      label: 'Link',
      description: 'Link',
      icon: ExternalLink,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      type: 'external_link',
      disabled: false,
    },
    {
      id: 'live',
      label: 'Curriculum Item (Live)',
      description: 'Curriculum Item Zoom Curriculum Item Google Meet',
      icon: Radio,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      type: 'live',
      disabled: false,
    },
    {
      id: 'quiz',
      label: 'Quiz (Quiz)',
      description: 'Quiz',
      icon: HelpCircle,
      color: 'bg-amber-50 text-amber-400 border-amber-200 opacity-70',
      type: 'quiz',
      disabled: true,
      badge: 'Curriculum Item',
    },
    {
      id: 'assignment',
      label: 'Curriculum Item / Curriculum Item (Assignment)',
      description: 'Instructor',
      icon: ClipboardCheck,
      color: 'bg-teal-50 text-teal-400 border-teal-200 opacity-70',
      type: 'assignment',
      disabled: true,
      badge: 'Curriculum Item',
    },
  ];

  const handleSelectOption = (option: typeof itemOptions[0]) => {
    if (option.disabled) return;
    onClose();
    navigate(`/admin/courses/${courseId}/lessons/new?sectionId=${sectionId}&type=${option.type}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/60 backdrop-blur-xs" dir="ltr">
      <div className="bg-white rounded-2xl border border-primary-200 shadow-xl max-w-2xl w-full p-6 space-y-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Add</span>
              </span>
              {sectionTitle && (
                <span className="text-xs text-primary-500 font-medium">
                  Section: <strong className="text-primary-800">{sectionTitle}</strong>
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-primary-900">Select</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-primary-400 hover:text-primary-800 hover:bg-primary-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
          {itemOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 relative ${
                  opt.disabled
                    ? 'bg-primary-50/50 border-primary-200/80 cursor-not-allowed opacity-60'
                    : 'bg-white hover:bg-amber-50/40 hover:border-amber-300 border-primary-200 hover:shadow-2xs cursor-pointer group'
                }`}
              >
                <div className={`p-3 rounded-xl border flex-shrink-0 ${opt.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-primary-900 group-hover:text-amber-900 transition-colors">
                      {opt.label}
                    </h4>
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-200 text-primary-700">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary-500 leading-relaxed line-clamp-2">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-primary-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import {
  GripVertical,
  Video,
  FileText,
  FileCode,
  Volume2,
  Code,
  ExternalLink,
  Radio,
  HelpCircle,
  ClipboardCheck,
  Clock,
  Edit2,
  Copy,
  Trash2,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CurriculumItemViewModel } from '../../../types/database.types';

interface CurriculumItemRowProps {
  item: CurriculumItemViewModel;
  courseId: string;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
  onMoveToPosition?: (id: string, direction: 'top' | 'bottom') => void;
  isOverlay?: boolean;
}

export const CurriculumItemRow: React.FC<CurriculumItemRowProps> = ({
  item,
  courseId,
  index,
  isSelected = false,
  onToggleSelect,
  onDuplicate,
  onDelete,
  onTogglePublish,
  onMoveToPosition,
  isOverlay = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'article': return <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'pdf': return <FileCode className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      case 'external_link': return <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case 'embed': return <Code className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
      case 'live': return <Radio className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'assignment': return <ClipboardCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />;
      default: return <Video className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Curriculum Item';
      case 'article': return 'Curriculum Item';
      case 'pdf': return 'PDF';
      case 'audio': return 'Curriculum Item';
      case 'external_link': return 'Link';
      case 'embed': return 'Curriculum Item';
      case 'live': return 'Curriculum Item';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Curriculum Item';
      default: return 'Lesson';
    }
  };

  if (isOverlay) {
    return (
      <div className="p-3.5 bg-white border-2 border-amber-500 rounded-xl shadow-xl flex items-center justify-between gap-3 text-left cursor-grabbing scale-102">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-amber-600" />
          {getItemTypeIcon(item.itemType)}
          <span className="font-bold text-primary-900 text-sm">{item.title}</span>
        </div>
        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 sm:gap-3 text-left ${
        isSelected
          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/30'
          : 'bg-white hover:bg-primary-50/80 border-primary-200/80 hover:border-primary-300'
      }`}
    >
      {/* Right side: Checkbox + Drag handle + Icon + Curriculum Item */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        {onToggleSelect && (
          <button
            type="button"
            onClick={() => onToggleSelect(item.id)}
            className="text-primary-400 hover:text-amber-600 transition-colors flex-shrink-0 p-0.5"
            title="Curriculum Item"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 text-primary-300 group-hover:text-primary-600 cursor-grab active:cursor-grabbing rounded-lg hover:bg-primary-100 transition-colors flex-shrink-0"
          title="Sort"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Item Type Icon */}
        {getItemTypeIcon(item.itemType)}

        {/* Title & Badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-bold text-primary-900 text-xs sm:text-sm truncate">
              {index + 1}. {item.title}
            </h5>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-caption text-primary-500">
            <span className="font-medium bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded">
              {getItemTypeLabel(item.itemType)}
            </span>

            {item.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary-400" />
                {item.duration}
              </span>
            )}

            {item.isPreview && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-micro font-bold text-blue-800">
                Free
              </span>
            )}

            <span
              className={`rounded px-1.5 py-0.5 text-micro font-bold ${
                item.isPublished
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {item.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Left side: Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          to={`/admin/courses/${courseId}/lessons/${item.id}/edit`}
          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Link>

        {onDuplicate && (
          <button
            type="button"
            onClick={() => onDuplicate(item.id)}
            className="p-1.5 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
            title="Curriculum Item"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* More options menu toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 text-primary-400 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
            title="Curriculum Item"
          >
            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute left-0 mt-1 w-44 bg-white border border-primary-200 rounded-xl shadow-lg z-20 py-1 text-xs font-bold text-primary-800"
              onMouseLeave={() => setShowMenu(false)}
            >
              {onTogglePublish && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePublish(item.id, item.isPublished);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-primary-50 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-primary-500" />
                  <span>{item.isPublished ? 'Draft' : 'Publish'}</span>
                </button>
              )}

              {onMoveToPosition && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToPosition(item.id, 'top');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-50 flex items-center gap-2"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-primary-500" />
                    <span>Curriculum Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onMoveToPosition(item.id, 'bottom');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-50 flex items-center gap-2"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-primary-500" />
                    <span>Curriculum Item</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

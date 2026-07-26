import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Copy,
  Trash2,
  BookOpen,
  CheckCircle2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { CurriculumSectionViewModel } from '../../../types/database.types';
import { CurriculumItemRow } from './CurriculumItemRow';

interface CurriculumSectionCardProps {
  section: CurriculumSectionViewModel;
  courseId: string;
  selectedItemIds: string[];
  onToggleSelectItem?: (id: string) => void;
  onAddItem: (sectionId: string, sectionTitle: string) => void;
  onEditSection: (sectionId: string, title: string, description?: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onTogglePublishItem: (itemId: string, currentStatus: boolean) => void;
  onMoveItemToPosition: (itemId: string, direction: 'top' | 'bottom') => void;
  isOverlay?: boolean;
}

export const CurriculumSectionCard: React.FC<CurriculumSectionCardProps> = ({
  section,
  courseId,
  selectedItemIds,
  onToggleSelectItem,
  onAddItem,
  onEditSection,
  onDuplicateSection,
  onDeleteSection,
  onDuplicateItem,
  onDeleteItem,
  onTogglePublishItem,
  onMoveItemToPosition,
  isOverlay = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(section.isCollapsed || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDesc, setEditDesc] = useState(section.description || '');

  // Section Sortable
  const {
    attributes,
    listeners,
    setNodeRef: setSectionRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  // Empty Section Droppable
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${section.id}`,
    data: { sectionId: section.id },
  });

  const sectionStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const itemIds = section.items.map((it) => it.id);
  const publishedCount = section.items.filter((it) => it.isPublished).length;

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onEditSection(section.id, editTitle, editDesc);
    setIsEditing(false);
  };

  if (isOverlay) {
    return (
      <div className="bg-white rounded-2xl border-2 border-amber-500 p-5 shadow-2xl flex items-center justify-between text-left cursor-grabbing">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-amber-600" />
          <h4 className="font-bold text-primary-900 text-base">{section.title}</h4>
          <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg">
            {section.items.length} items
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setSectionRef}
      style={sectionStyle}
      className="bg-white rounded-2xl border border-primary-200/90 shadow-2xs overflow-hidden transition-all text-left hover:border-primary-300"
    >
      {/* Section Header */}
      <div className="p-4 sm:p-5 bg-primary-50/50 border-b border-primary-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Drag Handle */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 text-primary-400 hover:text-amber-600 cursor-grab active:cursor-grabbing rounded-xl hover:bg-primary-100/80 transition-colors flex-shrink-0 mt-0.5 sm:mt-0"
            title="Section"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Section Info / Inline Edit */}
          {isEditing ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm font-bold p-2 bg-white border border-primary-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Section..."
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-primary-200 rounded-xl outline-none"
                placeholder="Section (Section)..."
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-primary-200 hover:bg-primary-300 text-primary-800 font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-primary-900 text-base sm:text-lg">
                  {section.title}
                </h4>
                <span className="text-xs font-bold text-primary-500 bg-white border border-primary-200 px-2.5 py-0.5 rounded-md">
                  {section.items.length} items
                </span>
              </div>
              {section.description && (
                <p className="text-xs text-primary-500 mt-0.5 line-clamp-1">
                  {section.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Header Stats & Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-primary-100">
          <div className="flex items-center gap-2 text-xs text-primary-600 font-medium">
            <span className="flex items-center gap-1 bg-white border border-primary-200 px-2 py-1 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              {section.items.length} Lessons
            </span>
            <span className="flex items-center gap-1 bg-white border border-primary-200 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {publishedCount} Published
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAddItem(section.id, section.title)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-2 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-xl transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDuplicateSection(section.id)}
              className="p-2 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-xl transition-colors"
              title="Section"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteSection(section.id)}
              className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-2 text-primary-500 hover:text-primary-800 hover:bg-primary-100 rounded-xl transition-colors"
              title={isCollapsed ? 'Section' : 'Section'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section Items Body */}
      {!isCollapsed && (
        <div ref={setDroppableRef} className="p-3 sm:p-4 bg-primary-50/20 min-h-[70px]">
          {section.items.length === 0 ? (
            <div
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-colors flex flex-col items-center justify-center gap-2 ${
                isOver ? 'border-amber-500 bg-amber-50/60' : 'border-primary-200 bg-primary-50/40'
              }`}
            >
              <Layers className="w-6 h-6 text-primary-400" />
              <p className="text-xs font-bold text-primary-600">
                Section. Section &quot;Add&quot;.
              </p>
              <button
                type="button"
                onClick={() => onAddItem(section.id, section.title)}
                className="mt-1 text-xs text-amber-700 hover:text-amber-800 font-bold underline"
              >
                Add
              </button>
            </div>
          ) : (
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <CurriculumItemRow
                    key={item.id}
                    item={item}
                    courseId={courseId}
                    index={idx}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggleSelect={onToggleSelectItem}
                    onDuplicate={onDuplicateItem}
                    onDelete={onDeleteItem}
                    onTogglePublish={onTogglePublishItem}
                    onMoveToPosition={onMoveItemToPosition}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

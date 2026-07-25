import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { CurriculumSectionViewModel, CurriculumItemViewModel } from '../../../types/database.types';
import { CurriculumSectionCard } from './CurriculumSectionCard';
import { CurriculumItemRow } from './CurriculumItemRow';

interface CurriculumDragOverlayProps {
  activeId: string | null;
  sections: CurriculumSectionViewModel[];
  courseId: string;
}

export function CurriculumDragOverlay({
  activeId,
  sections,
  courseId,
}: CurriculumDragOverlayProps) {
  if (!activeId) return null;

  // Check if activeId is a section
  const activeSection = sections.find((s) => s.id === activeId);
  if (activeSection) {
    return (
      <DragOverlay>
        <CurriculumSectionCard
          section={activeSection}
          courseId={courseId}
          selectedItemIds={[]}
          onAddItem={() => {}}
          onEditSection={() => {}}
          onDuplicateSection={() => {}}
          onDeleteSection={() => {}}
          onDuplicateItem={() => {}}
          onDeleteItem={() => {}}
          onTogglePublishItem={() => {}}
          onMoveItemToPosition={() => {}}
          isOverlay={true}
        />
      </DragOverlay>
    );
  }

  // Check if activeId is an item
  let activeItem: CurriculumItemViewModel | undefined;
  for (const sec of sections) {
    const found = sec.items.find((it) => it.id === activeId);
    if (found) {
      activeItem = found;
      break;
    }
  }

  if (activeItem) {
    return (
      <DragOverlay>
        <CurriculumItemRow
          item={activeItem}
          courseId={courseId}
          index={0}
          isOverlay={true}
        />
      </DragOverlay>
    );
  }

  return null;
}

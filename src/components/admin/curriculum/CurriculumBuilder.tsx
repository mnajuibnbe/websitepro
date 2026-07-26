import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Plus,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertCircle,
  FolderPlus,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  MoveRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';

import {
  CurriculumSectionViewModel,
  CurriculumItemViewModel,
} from '../../../types/database.types';
import { CurriculumService } from '../../../services/curriculum.service';
import { CurriculumSectionCard } from './CurriculumSectionCard';
import { AddCurriculumItemDialog } from './AddCurriculumItemDialog';
import { CurriculumDragOverlay } from './CurriculumDragOverlay';

interface CurriculumBuilderProps {
  courseId: string;
}

export function CurriculumBuilder({ courseId }: CurriculumBuilderProps) {
  const [sections, setSections] = useState<CurriculumSectionViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Drag State
  const [activeId, setActiveId] = useState<string | null>(null);

  // Selection Mode (Bulk Actions)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [targetBulkSectionId, setTargetBulkSectionId] = useState<string>('');

  // Dialogs State
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedSectionForAdd, setSelectedSectionForAdd] = useState<{
    id: string;
    title: string;
  }>({ id: '', title: '' });

  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // Delete Section Modal
  const [deleteSectionModal, setDeleteSectionModal] = useState<{
    isOpen: boolean;
    section: CurriculumSectionViewModel | null;
    moveTargetId: string;
  }>({ isOpen: false, section: null, moveTargetId: '' });

  // Soft Delete & Undo Toast
  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    itemIds: string[];
    message: string;
    timeoutId?: NodeJS.Timeout;
  }>({ show: false, itemIds: [], message: '' });

  // Setup dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch Curriculum Data
  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CurriculumService.getCurriculum(courseId);
      setSections(data);
    } catch (err: any) {
      console.error('Failed loading curriculum:', err);
      setError('Course. Please review the information and try again..');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  // Find container section for an item ID or section ID
  const findSectionByItemId = (itemId: string): CurriculumSectionViewModel | undefined => {
    return sections.find((sec) => sec.items.some((it) => it.id === itemId));
  };

  // Drag Start Handler
  const handleDragStart = (event: DragStartEvent) => {
    if (isSavingOrder) return;
    setActiveId(String(event.active.id));
  };

  // Drag Over Handler (handles moving item over different section drop zones)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Is active item a section or a lesson?
    const isActiveSection = sections.some((s) => s.id === activeIdStr);
    if (isActiveSection) return; // Sections handle reordering on drag end

    // Active is a lesson item
    const sourceSection = findSectionByItemId(activeIdStr);
    let targetSection: CurriculumSectionViewModel | undefined;

    if (overIdStr.startsWith('droppable-')) {
      const secId = overIdStr.replace('droppable-', '');
      targetSection = sections.find((s) => s.id === secId);
    } else {
      targetSection = findSectionByItemId(overIdStr) || sections.find((s) => s.id === overIdStr);
    }

    if (!sourceSection || !targetSection || sourceSection.id === targetSection.id) {
      return;
    }

    // Optimistically shift item across sections in local state
    setSections((prevSections) => {
      const newSections = prevSections.map((sec) => ({ ...sec, items: [...sec.items] }));
      const srcSec = newSections.find((s) => s.id === sourceSection.id);
      const destSec = newSections.find((s) => s.id === targetSection.id);

      if (!srcSec || !destSec) return prevSections;

      const itemIndex = srcSec.items.findIndex((it) => it.id === activeIdStr);
      if (itemIndex === -1) return prevSections;

      const [movedItem] = srcSec.items.splice(itemIndex, 1);
      movedItem.sectionId = destSec.id;

      let overIndex = destSec.items.findIndex((it) => it.id === overIdStr);
      if (overIndex === -1) overIndex = destSec.items.length;

      destSec.items.splice(overIndex, 0, movedItem);

      return newSections;
    });
  };

  // Drag End Handler (Persists reorder to DB with Snapshot Rollback)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr === overIdStr) return;

    // Snapshot for optimistic rollback
    const snapshot = JSON.parse(JSON.stringify(sections)) as CurriculumSectionViewModel[];

    // 1. Reordering Sections
    const isSectionDrag = sections.some((s) => s.id === activeIdStr);
    if (isSectionDrag) {
      const oldIndex = sections.findIndex((s) => s.id === activeIdStr);
      const newIndex = sections.findIndex((s) => s.id === overIdStr);

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        const movedSections: CurriculumSectionViewModel[] = arrayMove(sections, oldIndex, newIndex);
        const reorderedSections = movedSections.map((s, idx) => ({
          ...s,
          orderIndex: idx,
        }));

        setSections(reorderedSections);
        setIsSavingOrder(true);

        try {
          const orderedIds = reorderedSections.map((s) => s.id);
          await CurriculumService.reorderSections(courseId, orderedIds);
        } catch (err) {
          console.error('Failed to save section reorder:', err);
          setSections(snapshot);
          setError('Save. Learn More.');
        } finally {
          setIsSavingOrder(false);
        }
      }
      return;
    }

    // 2. Reordering Items inside same section or across sections
    const sourceSec = findSectionByItemId(activeIdStr);
    if (!sourceSec) return;

    const itemsInSec = sourceSec.items;
    const oldIndex = itemsInSec.findIndex((it) => it.id === activeIdStr);
    let newIndex = itemsInSec.findIndex((it) => it.id === overIdStr);

    if (newIndex === -1) {
      newIndex = itemsInSec.length > 0 ? itemsInSec.length - 1 : 0;
    }

    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      const movedItems: CurriculumItemViewModel[] = arrayMove(itemsInSec, oldIndex, newIndex);
      const reorderedItems = movedItems.map((it, idx) => ({
        ...it,
        orderIndex: idx,
      }));

      const updatedSections = sections.map((sec) =>
        sec.id === sourceSec.id ? { ...sec, items: reorderedItems } : sec
      );

      setSections(updatedSections);
      setIsSavingOrder(true);

      try {
        const itemIds = reorderedItems.map((it) => it.id);
        await CurriculumService.reorderItems(sourceSec.id, itemIds, courseId);
      } catch (err) {
        console.error('Failed to save item reorder:', err);
        setSections(snapshot);
        setError('Save. Learn More.');
      } finally {
        setIsSavingOrder(false);
      }
    }
  };

  // Create Section
  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      const created = await CurriculumService.createSection(courseId, {
        title: newSectionTitle,
        description: newSectionDesc,
      });
      setSections((prev) => [...prev, created]);
      setNewSectionTitle('');
      setNewSectionDesc('');
      setAddSectionDialogOpen(false);
    } catch (err) {
      console.error('Error creating section:', err);
      setError('Create.');
    }
  };

  // Edit Section
  const handleEditSection = async (sectionId: string, title: string, description?: string) => {
    try {
      await CurriculumService.updateSection(sectionId, { title, description });
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title, description: description || null } : s))
      );
    } catch (err) {
      console.error('Error updating section:', err);
      setError('Edit.');
    }
  };

  // Duplicate Section
  const handleDuplicateSection = async (sectionId: string) => {
    try {
      const duplicated = await CurriculumService.duplicateSection(courseId, sectionId);
      setSections((prev) => {
        const idx = prev.findIndex((s) => s.id === sectionId);
        const copy = [...prev];
        copy.splice(idx + 1, 0, duplicated);
        return copy;
      });
    } catch (err: any) {
      console.error('Error duplicating section:', err);
      setError(err?.message || 'Section.');
    }
  };

  // Delete Section Prompt
  const handleDeleteSectionPrompt = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;

    if (sec.items.length === 0) {
      // Direct delete empty section
      confirmDeleteSection(sectionId);
    } else {
      // Show confirmation dialog with options
      const otherSections = sections.filter((s) => s.id !== sectionId);
      setDeleteSectionModal({
        isOpen: true,
        section: sec,
        moveTargetId: otherSections.length > 0 ? otherSections[0].id : '',
      });
    }
  };

  const confirmDeleteSection = async (
    sectionId: string,
    moveItemsToSectionId?: string
  ) => {
    try {
      await CurriculumService.deleteSection(courseId, sectionId, { moveItemsToSectionId });
      setDeleteSectionModal({ isOpen: false, section: null, moveTargetId: '' });
      await loadCurriculum();
    } catch (err: any) {
      console.error('Error deleting section:', err);
      setError(err?.message || 'Delete.');
    }
  };

  // Item Actions
  const handleDuplicateItem = async (itemId: string) => {
    try {
      const duplicated = await CurriculumService.duplicateItem(itemId);
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id === duplicated.sectionId) {
            const idx = sec.items.findIndex((it) => it.id === itemId);
            const copyItems = [...sec.items];
            copyItems.splice(idx + 1, 0, duplicated);
            return { ...sec, items: copyItems };
          }
          return sec;
        })
      );
    } catch (err) {
      console.error('Error duplicating item:', err);
      setError('Lesson.');
    }
  };

  const handleTogglePublishItem = async (itemId: string, currentStatus: boolean) => {
    try {
      await CurriculumService.bulkPublish(courseId, [itemId], !currentStatus);
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((it) =>
            it.id === itemId ? { ...it, isPublished: !currentStatus } : it
          ),
        }))
      );
    } catch (err) {
      console.error('Error toggling publish:', err);
      setError('Update.');
    }
  };

  const handleMoveItemToPosition = async (itemId: string, direction: 'top' | 'bottom') => {
    const sec = findSectionByItemId(itemId);
    if (!sec) return;

    const items = [...sec.items];
    const itemIdx = items.findIndex((it) => it.id === itemId);
    if (itemIdx === -1) return;

    const [moved] = items.splice(itemIdx, 1);
    if (direction === 'top') {
      items.unshift(moved);
    } else {
      items.push(moved);
    }

    const reorderedIds = items.map((it) => it.id);
    setSections((prev) =>
      prev.map((s) => (s.id === sec.id ? { ...s, items } : s))
    );

    try {
      await CurriculumService.reorderItems(sec.id, reorderedIds, courseId);
    } catch (err) {
      console.error('Error moving item to position:', err);
      loadCurriculum();
    }
  };

  // Delete Item with Soft Delete & Undo Toast
  const handleDeleteItem = async (itemId: string) => {
    const itemSec = findSectionByItemId(itemId);
    const item = itemSec?.items.find((it) => it.id === itemId);

    // Optimistically remove from state
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => it.id !== itemId),
      }))
    );

    try {
      await CurriculumService.deleteItem(itemId);

      // Trigger Undo Toast
      if (undoToast.timeoutId) clearTimeout(undoToast.timeoutId);

      const timeout = setTimeout(() => {
        setUndoToast({ show: false, itemIds: [], message: '' });
      }, 7000);

      setUndoToast({
        show: true,
        itemIds: [itemId],
        message: `Delete "${item?.title || 'Learn More'}" Success.`,
        timeoutId: timeout,
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      loadCurriculum();
    }
  };

  // Undo Delete
  const handleUndoDelete = async () => {
    if (undoToast.itemIds.length === 0) return;
    try {
      for (const id of undoToast.itemIds) {
        await CurriculumService.restoreItem(id);
      }
      if (undoToast.timeoutId) clearTimeout(undoToast.timeoutId);
      setUndoToast({ show: false, itemIds: [], message: '' });
      await loadCurriculum();
    } catch (err) {
      console.error('Error restoring items:', err);
      setError('Unable to complete this action.');
    }
  };

  // Toggle Item Selection
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Select All
  const handleSelectAllItems = () => {
    const allIds: string[] = [];
    sections.forEach((sec) => sec.items.forEach((it) => allIds.push(it.id)));
    if (selectedItemIds.length === allIds.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(allIds);
    }
  };

  // Bulk Actions
  const handleBulkPublish = async (isPublished: boolean) => {
    try {
      await CurriculumService.bulkPublish(courseId, selectedItemIds, isPublished);
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((it) =>
            selectedItemIds.includes(it.id) ? { ...it, isPublished } : it
          ),
        }))
      );
      setSelectedItemIds([]);
    } catch (err: any) {
      console.error('Error bulk publishing:', err);
      setError(err?.message || 'Update.');
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedItemIds];
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => !ids.includes(it.id)),
      }))
    );
    setSelectedItemIds([]);

    try {
      await CurriculumService.bulkDelete(ids);

      if (undoToast.timeoutId) clearTimeout(undoToast.timeoutId);
      const timeout = setTimeout(() => {
        setUndoToast({ show: false, itemIds: [], message: '' });
      }, 7000);

      setUndoToast({
        show: true,
        itemIds: ids,
        message: `Delete ${ids.length} Learn More/Lessons.`,
        timeoutId: timeout,
      });
    } catch (err) {
      console.error('Error bulk deleting:', err);
      loadCurriculum();
    }
  };

  const handleBulkMove = async () => {
    if (!targetBulkSectionId) return;
    try {
      await CurriculumService.bulkMove(courseId, selectedItemIds, targetBulkSectionId);
      setShowBulkMoveDialog(false);
      setSelectedItemIds([]);
      await loadCurriculum();
    } catch (err: any) {
      console.error('Error bulk moving items:', err);
      setError(err?.message || 'Unable to complete this action.');
    }
  };

  // Expand / Collapse All
  const handleToggleExpandAll = (expand: boolean) => {
    setSections((prev) => prev.map((s) => ({ ...s, isCollapsed: !expand })));
  };

  // Total stats
  const totalSections = sections.length;
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const totalPublished = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.isPublished).length,
    0
  );

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-primary-200/80 shadow-2xs space-y-4" dir="ltr">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-primary-700">Course...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="ltr">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-primary-200/90 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Curriculum</span>
            </span>

            {isSavingOrder && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Save...</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-primary-900">Course</h2>
          <p className="text-xs text-primary-500 mt-0.5">
            Add.
          </p>
        </div>

        {/* Action Controls & Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-primary-700 border-l border-primary-200 pl-4 ml-1">
            <span>{totalSections} Learn More</span>
            <span className="text-primary-300">•</span>
            <span>{totalItems} Lessons</span>
            <span className="text-primary-300">•</span>
            <span className="text-emerald-700">{totalPublished} Published</span>
          </div>

          <button
            type="button"
            onClick={() => handleToggleExpandAll(true)}
            className="p-2 text-primary-600 hover:text-primary-900 bg-primary-100/60 hover:bg-primary-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
            title="Learn More"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Learn More</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleExpandAll(false)}
            className="p-2 text-primary-600 hover:text-primary-900 bg-primary-100/60 hover:bg-primary-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
            title="Learn More"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Learn More</span>
          </button>

          <button
            type="button"
            onClick={() => loadCurriculum()}
            className="p-2 text-primary-600 hover:text-primary-900 bg-primary-100/60 hover:bg-primary-100 rounded-xl transition-colors"
            title="Update"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setAddSectionDialogOpen(true)}
            className="px-4 py-2.5 bg-primary-900 hover:bg-primary-950 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl flex items-center justify-between text-danger-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-danger-600 hover:text-danger-900 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedItemIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 bg-primary-900 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-amber-500 text-primary-950 px-2.5 py-1 rounded-lg">
              Learn More {selectedItemIds.length} Learn More
            </span>

            <button
              type="button"
              onClick={handleSelectAllItems}
              className="text-xs text-primary-300 hover:text-white underline font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkPublish(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkPublish(false)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Draft</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const available = sections.filter((s) => s.items.length >= 0);
                setTargetBulkSectionId(available.length > 0 ? available[0].id : '');
                setShowBulkMoveDialog(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span>Learn More</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Undo Soft Delete Toast */}
      {undoToast.show && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-primary-900 text-white rounded-2xl shadow-2xl border border-primary-700 flex items-center justify-between gap-4 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-bold">{undoToast.message}</p>
          </div>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-primary-950 font-bold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Learn More</span>
          </button>
        </div>
      )}

      {/* Curriculum Sections List */}
      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-primary-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-base text-primary-900">No items are available yet.</h3>
            <p className="text-xs text-primary-500 leading-relaxed">
              Build practical skills with structured, expert-led course content..
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddSectionDialogOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section) => (
                <CurriculumSectionCard
                  key={section.id}
                  section={section}
                  courseId={courseId}
                  selectedItemIds={selectedItemIds}
                  onToggleSelectItem={handleToggleSelectItem}
                  onAddItem={(secId, secTitle) => {
                    setSelectedSectionForAdd({ id: secId, title: secTitle });
                    setAddItemDialogOpen(true);
                  }}
                  onEditSection={handleEditSection}
                  onDuplicateSection={handleDuplicateSection}
                  onDeleteSection={handleDeleteSectionPrompt}
                  onDuplicateItem={handleDuplicateItem}
                  onDeleteItem={handleDeleteItem}
                  onTogglePublishItem={handleTogglePublishItem}
                  onMoveItemToPosition={handleMoveItemToPosition}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag Overlay Preview */}
          <CurriculumDragOverlay
            activeId={activeId}
            sections={sections}
            courseId={courseId}
          />
        </DndContext>
      )}

      {/* Dialog: Add Section */}
      {addSectionDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/60 backdrop-blur-xs" dir="ltr">
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-primary-100 pb-3">
              <h3 className="text-base font-bold text-primary-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <span>Course</span>
              </h3>
              <button
                onClick={() => setAddSectionDialogOpen(false)}
                className="p-1 text-primary-400 hover:text-primary-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary-800 mb-1">
                  Section *
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Learn More: Learn More - Learn More"
                  className="w-full text-xs font-bold p-3 bg-primary-50/50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-800 mb-1">
                  Section (Learn More)
                </label>
                <textarea
                  rows={3}
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  placeholder="Content..."
                  className="w-full text-xs p-3 bg-primary-50/50 border border-primary-200 rounded-xl outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100">
              <button
                type="button"
                onClick={() => setAddSectionDialogOpen(false)}
                className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSection}
                disabled={!newSectionTitle.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Add Item */}
      <AddCurriculumItemDialog
        isOpen={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
        courseId={courseId}
        sectionId={selectedSectionForAdd.id}
        sectionTitle={selectedSectionForAdd.title}
      />

      {/* Dialog: Delete Section Prompt */}
      {deleteSectionModal.isOpen && deleteSectionModal.section && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/60 backdrop-blur-xs" dir="ltr">
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-primary-900">Delete</h3>
            </div>

            <p className="text-xs text-primary-600 leading-relaxed">
              Section <strong>&quot;{deleteSectionModal.section.title}&quot;</strong> Learn More{' '}
              <strong className="text-amber-800">{deleteSectionModal.section.items.length} Lessons</strong>.
              Select:
            </p>

            {sections.filter((s) => s.id !== deleteSectionModal.section?.id).length > 0 && (
              <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900">
                  Delete:
                </label>
                <select
                  value={deleteSectionModal.moveTargetId}
                  onChange={(e) =>
                    setDeleteSectionModal((prev) => ({ ...prev, moveTargetId: e.target.value }))
                  }
                  className="w-full text-xs font-bold p-2 bg-white border border-amber-300 rounded-lg outline-none"
                >
                  {sections
                    .filter((s) => s.id !== deleteSectionModal.section?.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    confirmDeleteSection(
                      deleteSectionModal.section!.id,
                      deleteSectionModal.moveTargetId
                    )
                  }
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors mt-2"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-between gap-2 border-t border-primary-100">
              <button
                type="button"
                onClick={() =>
                  setDeleteSectionModal({ isOpen: false, section: null, moveTargetId: '' })
                }
                className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => confirmDeleteSection(deleteSectionModal.section!.id)}
                className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Bulk Move Selection */}
      {showBulkMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/60 backdrop-blur-xs" dir="ltr">
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-primary-900">
              Learn More {selectedItemIds.length} Learn More
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary-800">Section:</label>
              <select
                value={targetBulkSectionId}
                onChange={(e) => setTargetBulkSectionId(e.target.value)}
                className="w-full text-xs font-bold p-3 bg-primary-50 border border-primary-200 rounded-xl outline-none"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title} ({sec.items.length} Lessons)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-primary-100">
              <button
                type="button"
                onClick={() => setShowBulkMoveDialog(false)}
                className="px-4 py-2 bg-primary-100 text-primary-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkMove}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

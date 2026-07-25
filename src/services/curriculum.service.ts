import { supabase } from '../lib/supabase';
import {
  CourseSection,
  Lesson,
  CurriculumItemViewModel,
  CurriculumSectionViewModel,
} from '../types/database.types';
import { LessonService } from './lesson.service';

export class CurriculumService {
  /**
   * Helper to map raw DB Lesson row to CurriculumItemViewModel
   */
  private static mapLessonToViewModel(lesson: Lesson): CurriculumItemViewModel {
    const rawType = lesson.lesson_type || lesson.type || 'video';
    const normalizedType = [
      'video',
      'article',
      'pdf',
      'audio',
      'embed',
      'external_link',
      'live',
      'quiz',
      'assignment',
    ].includes(rawType)
      ? rawType
      : rawType === 'text'
      ? 'article'
      : 'video';

    return {
      id: lesson.id,
      courseId: lesson.course_id,
      sectionId: lesson.section_id || '',
      title: lesson.title,
      itemType: normalizedType,
      orderIndex: lesson.order_index ?? 0,
      duration: lesson.duration || (lesson.estimated_minutes ? `${lesson.estimated_minutes} دقيقة` : null),
      estimatedMinutes: lesson.estimated_minutes,
      isPublished: Boolean(lesson.is_published),
      isPreview: Boolean(lesson.is_preview),
      sourceTable: 'lessons',
      sourceId: lesson.id,
      deletedAt: lesson.deleted_at || null,
    };
  }

  /**
   * Fetch full curriculum structure (sections + active items) for a course
   */
  static async getCurriculum(courseId: string, includeDeleted = false): Promise<CurriculumSectionViewModel[]> {
    // 1. Fetch sections
    let sectionsQuery = supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (!includeDeleted) {
      sectionsQuery = sectionsQuery.is('deleted_at', null);
    }

    const { data: sectionsData, error: sectionsErr } = await sectionsQuery;
    if (sectionsErr) {
      console.error('Error fetching course sections:', sectionsErr);
      throw sectionsErr;
    }

    const sections = (sectionsData || []) as CourseSection[];

    // 2. Fetch lessons
    let lessonsQuery = supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (!includeDeleted) {
      lessonsQuery = lessonsQuery.is('deleted_at', null);
    }

    const { data: lessonsData, error: lessonsErr } = await lessonsQuery;
    if (lessonsErr) {
      console.error('Error fetching course lessons:', lessonsErr);
      throw lessonsErr;
    }

    const lessons = (lessonsData || []) as Lesson[];

    // Group items by sectionId
    const itemsBySection: Record<string, CurriculumItemViewModel[]> = {};
    for (const lesson of lessons) {
      const secId = lesson.section_id || 'unassigned';
      if (!itemsBySection[secId]) {
        itemsBySection[secId] = [];
      }
      itemsBySection[secId].push(this.mapLessonToViewModel(lesson));
    }

    // Sort items within each section by orderIndex
    Object.keys(itemsBySection).forEach((secId) => {
      itemsBySection[secId].sort((a, b) => a.orderIndex - b.orderIndex);
    });

    // Build ViewModels for sections
    return sections.map((sec) => ({
      id: sec.id,
      courseId: sec.course_id,
      title: sec.title,
      description: sec.description,
      orderIndex: sec.order_index ?? 0,
      isPublished: Boolean(sec.is_published),
      deletedAt: sec.deleted_at || null,
      items: itemsBySection[sec.id] || [],
    }));
  }

  /**
   * Create a new course section
   */
  static async createSection(
    courseId: string,
    data: { title: string; description?: string }
  ): Promise<CurriculumSectionViewModel> {
    const existingSections = await this.getCurriculum(courseId);
    const nextOrder =
      existingSections.length > 0 ? Math.max(...existingSections.map((s) => s.orderIndex)) + 1 : 0;

    const payload = {
      course_id: courseId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      order_index: nextOrder,
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('course_sections')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating section:', error);
      throw error;
    }

    const sec = inserted as CourseSection;
    return {
      id: sec.id,
      courseId: sec.course_id,
      title: sec.title,
      description: sec.description,
      orderIndex: sec.order_index,
      isPublished: sec.is_published,
      items: [],
    };
  }

  /**
   * Update section fields
   */
  static async updateSection(sectionId: string, data: Partial<CourseSection>): Promise<CourseSection> {
    const payload: Record<string, any> = {
      title: data.title?.trim(),
      description: data.description?.trim() || null,
      is_published: data.is_published,
      order_index: data.order_index,
      updated_at: new Date().toISOString(),
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    const { data: updated, error } = await supabase
      .from('course_sections')
      .update(payload)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating section:', error);
      throw error;
    }

    return updated as CourseSection;
  }

  /**
   * Delete section with option to reassign items or delete
   */
  static async deleteSection(
    sectionId: string,
    options?: { moveItemsToSectionId?: string }
  ): Promise<void> {
    if (options?.moveItemsToSectionId) {
      // Reassign lessons to target section
      const { error: moveErr } = await supabase
        .from('lessons')
        .update({ section_id: options.moveItemsToSectionId, updated_at: new Date().toISOString() })
        .eq('section_id', sectionId);

      if (moveErr) throw moveErr;
    } else {
      // Delete lessons in this section
      const { error: delLessonsErr } = await supabase
        .from('lessons')
        .delete()
        .eq('section_id', sectionId);

      if (delLessonsErr) console.warn('Warning deleting lessons in section:', delLessonsErr);
    }

    const { error } = await supabase.from('course_sections').delete().eq('id', sectionId);
    if (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }

  /**
   * Duplicate section and all lessons within it
   */
  static async duplicateSection(sectionId: string): Promise<CurriculumSectionViewModel> {
    // 1. Fetch section
    const { data: original, error: secErr } = await supabase
      .from('course_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (secErr || !original) throw new Error('القسم المطلوب غير موجود.');

    const origSec = original as CourseSection;

    // 2. Shift subsequent sections
    const existingCurriculum = await this.getCurriculum(origSec.course_id);
    const targetOrder = origSec.order_index + 1;

    for (const sec of existingCurriculum) {
      if (sec.orderIndex >= targetOrder) {
        await supabase
          .from('course_sections')
          .update({ order_index: sec.orderIndex + 1 })
          .eq('id', sec.id);
      }
    }

    // 3. Insert new section
    const newSecPayload = {
      course_id: origSec.course_id,
      title: `${origSec.title} (نسخة)`,
      description: origSec.description,
      order_index: targetOrder,
      is_published: origSec.is_published,
      updated_at: new Date().toISOString(),
    };

    const { data: createdSec, error: createSecErr } = await supabase
      .from('course_sections')
      .insert(newSecPayload)
      .select()
      .single();

    if (createSecErr || !createdSec) throw createSecErr;
    const newSec = createdSec as CourseSection;

    // 4. Duplicate lessons in section
    const originalLessons = await LessonService.getLessonsBySection(sectionId);
    const duplicatedItems: CurriculumItemViewModel[] = [];

    for (const lesson of originalLessons) {
      const copyPayload: Partial<Lesson> = {
        ...lesson,
        id: undefined,
        section_id: newSec.id,
        title: lesson.title,
        created_at: undefined,
        updated_at: undefined,
      };

      const newLesson = await LessonService.createLesson(copyPayload);
      duplicatedItems.push(this.mapLessonToViewModel(newLesson));
    }

    return {
      id: newSec.id,
      courseId: newSec.course_id,
      title: newSec.title,
      description: newSec.description,
      orderIndex: newSec.order_index,
      isPublished: newSec.is_published,
      items: duplicatedItems,
    };
  }

  /**
   * Reorder Sections (RPC with direct fallback)
   */
  static async reorderSections(courseId: string, orderedSectionIds: string[]): Promise<void> {
    try {
      const { error: rpcErr } = await supabase.rpc('admin_reorder_course_sections', {
        p_course_id: courseId,
        p_section_ids: orderedSectionIds,
      });

      if (!rpcErr) return;
      console.warn('RPC admin_reorder_course_sections not available, using direct updates:', rpcErr.message);
    } catch {
      // Fallback
    }

    for (let index = 0; index < orderedSectionIds.length; index++) {
      const secId = orderedSectionIds[index];
      await supabase
        .from('course_sections')
        .update({ order_index: index, updated_at: new Date().toISOString() })
        .eq('id', secId)
        .eq('course_id', courseId);
    }
  }

  /**
   * Move an item to a different section and position
   */
  static async moveItem(
    itemId: string,
    sourceSectionId: string,
    destinationSectionId: string,
    destinationIndex: number,
    courseId: string
  ): Promise<void> {
    try {
      const { error: rpcErr } = await supabase.rpc('admin_move_lesson', {
        p_course_id: courseId,
        p_lesson_id: itemId,
        p_destination_section_id: destinationSectionId,
        p_destination_index: destinationIndex,
      });

      if (!rpcErr) return;
      console.warn('RPC admin_move_lesson failed, using fallback updates:', rpcErr.message);
    } catch {
      // Fallback
    }

    // Direct fallback logic
    // Update target lesson section
    await supabase
      .from('lessons')
      .update({
        section_id: destinationSectionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('course_id', courseId);

    // Re-index destination section lessons
    const destLessons = await LessonService.getLessonsBySection(destinationSectionId);
    // Remove itemId if present
    const filtered = destLessons.filter((l) => l.id !== itemId);

    // Fetch the lesson object
    const targetLesson = await LessonService.getLessonById(itemId);
    if (targetLesson) {
      filtered.splice(destinationIndex, 0, targetLesson);
    }

    for (let i = 0; i < filtered.length; i++) {
      await supabase
        .from('lessons')
        .update({ order_index: i, section_id: destinationSectionId })
        .eq('id', filtered[i].id);
    }

    // Re-index source section if different
    if (sourceSectionId !== destinationSectionId) {
      const srcLessons = await LessonService.getLessonsBySection(sourceSectionId);
      for (let i = 0; i < srcLessons.length; i++) {
        await supabase
          .from('lessons')
          .update({ order_index: i })
          .eq('id', srcLessons[i].id);
      }
    }
  }

  /**
   * Reorder items inside a section
   */
  static async reorderItems(
    sectionId: string,
    orderedItemIds: string[],
    courseId: string
  ): Promise<void> {
    try {
      const { error: rpcErr } = await supabase.rpc('admin_reorder_section_lessons', {
        p_course_id: courseId,
        p_section_id: sectionId,
        p_lesson_ids: orderedItemIds,
      });

      if (!rpcErr) return;
      console.warn('RPC admin_reorder_section_lessons failed, using direct update:', rpcErr.message);
    } catch {
      // Fallback
    }

    for (let index = 0; index < orderedItemIds.length; index++) {
      const itemId = orderedItemIds[index];
      await supabase
        .from('lessons')
        .update({ order_index: index, section_id: sectionId, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('course_id', courseId);
    }
  }

  /**
   * Duplicate item
   */
  static async duplicateItem(itemId: string): Promise<CurriculumItemViewModel> {
    const duplicatedLesson = await LessonService.duplicateLesson(itemId);
    return this.mapLessonToViewModel(duplicatedLesson);
  }

  /**
   * Delete item (soft delete or hard delete)
   */
  static async deleteItem(itemId: string, softDelete = true): Promise<void> {
    if (softDelete) {
      try {
        const { error: rpcErr } = await supabase.rpc('admin_soft_delete_lessons', {
          p_lesson_ids: [itemId],
        });
        if (!rpcErr) return;
      } catch {
        // Fallback
      }

      const { error } = await supabase
        .from('lessons')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) {
        // If column doesn't exist, hard delete as fallback
        await LessonService.deleteLesson(itemId);
      }
    } else {
      await LessonService.deleteLesson(itemId);
    }
  }

  /**
   * Restore soft-deleted item
   */
  static async restoreItem(itemId: string): Promise<void> {
    try {
      const { error: rpcErr } = await supabase.rpc('admin_restore_lessons', {
        p_lesson_ids: [itemId],
      });
      if (!rpcErr) return;
    } catch {
      // Fallback
    }

    const { error } = await supabase
      .from('lessons')
      .update({ deleted_at: null })
      .eq('id', itemId);

    if (error) {
      console.error('Error restoring lesson:', error);
      throw error;
    }
  }

  /**
   * Bulk publish/unpublish items
   */
  static async bulkPublish(itemIds: string[], isPublished: boolean): Promise<void> {
    if (itemIds.length === 0) return;
    const { error } = await supabase
      .from('lessons')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .in('id', itemIds);

    if (error) {
      console.error('Error in bulkPublish:', error);
      throw error;
    }
  }

  /**
   * Bulk move items to target section
   */
  static async bulkMove(itemIds: string[], destinationSectionId: string, courseId: string): Promise<void> {
    if (itemIds.length === 0) return;

    // Get current lessons in destination section to calculate next order_index
    const destLessons = await LessonService.getLessonsBySection(destinationSectionId);
    let startOrder = destLessons.length;

    for (const itemId of itemIds) {
      await supabase
        .from('lessons')
        .update({
          section_id: destinationSectionId,
          order_index: startOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('course_id', courseId);

      startOrder++;
    }
  }

  /**
   * Bulk delete items
   */
  static async bulkDelete(itemIds: string[], softDelete = true): Promise<void> {
    if (itemIds.length === 0) return;
    if (softDelete) {
      try {
        const { error: rpcErr } = await supabase.rpc('admin_soft_delete_lessons', {
          p_lesson_ids: itemIds,
        });
        if (!rpcErr) return;
      } catch {
        // Fallback
      }

      const { error } = await supabase
        .from('lessons')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', itemIds);

      if (error) {
        // Hard delete fallback
        const { error: hardErr } = await supabase.from('lessons').delete().in('id', itemIds);
        if (hardErr) throw hardErr;
      }
    } else {
      const { error } = await supabase.from('lessons').delete().in('id', itemIds);
      if (error) throw error;
    }
  }
}

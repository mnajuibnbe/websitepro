import { supabase } from '../lib/supabase';
import {
  CourseSection,
  Lesson,
  CurriculumItemViewModel,
  CurriculumSectionViewModel,
} from '../types/database.types';
import { LessonService } from './lesson.service';

/**
 * Maps Supabase / PostgreSQL errors into clean Arabic messages
 */
export function mapCurriculumError(error: any): Error {
  if (!error) return new Error('حدث خطأ غير متوقع أثناء معالجة المنهج.');

  const msg = typeof error === 'string' ? error : error.message || error.details || '';
  const code = error.code || '';

  // Function not found (42883 or PGRST202 or missing RPC)
  if (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('Could not find the function') ||
    (msg.includes('function') && msg.includes('does not exist'))
  ) {
    return new Error('ميزة ترتيب وإدارة المنهج تحتاج إلى تطبيق تحديث قاعدة البيانات (Migration) في Supabase أولاً.');
  }

  // Permission denied / RLS
  if (code === '42501' || msg.includes('permission denied') || msg.includes('row-level security') || msg.includes('Access denied')) {
    return new Error('ليس لديك الصلاحيات الكافية لتنفيذ هذه العملية على المنهج الدراسي.');
  }

  // Mismatched course / relation error
  if (
    msg.includes('mismatch') ||
    msg.includes('does not belong to specified course') ||
    msg.includes('Destination section does not belong')
  ) {
    return new Error('لا يمكن تنفيذ العملية: العناصر المحددة لا تنتمي لنفس الدورة التدريبية.');
  }

  // Duplicate or constraint violation
  if (code === '23505' || code === '23502' || code === '23503' || msg.includes('Duplicate')) {
    return new Error('فشلت العملية بسبب وجود تعارض في البيانات أو تكرار في الترتيب.');
  }

  // Network error
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return new Error('تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال شبكة الإنترنت.');
  }

  return new Error(msg || 'حدث خطأ في تنفيذ عملية المنهج الدراسي.');
}

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
      throw mapCurriculumError(sectionsErr);
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
      throw mapCurriculumError(lessonsErr);
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
      throw mapCurriculumError(error);
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
      throw mapCurriculumError(error);
    }

    return updated as CourseSection;
  }

  /**
   * Soft delete section via atomic RPC (or reassign lessons)
   */
  static async deleteSection(
    courseId: string,
    sectionId: string,
    options?: { moveItemsToSectionId?: string }
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_soft_delete_section', {
      p_course_id: courseId,
      p_section_id: sectionId,
      p_move_items_to_section_id: options?.moveItemsToSectionId || null,
    });

    if (error) {
      console.error('RPC admin_soft_delete_section error:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Restore soft-deleted section via RPC
   */
  static async restoreSection(courseId: string, sectionId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_restore_section', {
      p_course_id: courseId,
      p_section_id: sectionId,
      p_restore_lessons: true,
    });

    if (error) {
      console.error('RPC admin_restore_section error:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Duplicate section and lessons
   */
  static async duplicateSection(sectionId: string): Promise<CurriculumSectionViewModel> {
    // 1. Fetch original section
    const { data: original, error: secErr } = await supabase
      .from('course_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (secErr || !original) throw new Error('القسم المطلوب غير موجود.');

    const origSec = original as CourseSection;

    // 2. Insert new duplicate section
    const existingCurriculum = await this.getCurriculum(origSec.course_id);
    const targetOrder = origSec.order_index + 1;

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

    if (createSecErr || !createdSec) throw mapCurriculumError(createSecErr);
    const newSec = createdSec as CourseSection;

    // 3. Duplicate active lessons in section
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

    // 4. Reorder sections atomically
    const allSecIds = existingCurriculum.map((s) => s.id);
    const origIdx = allSecIds.indexOf(sectionId);
    if (origIdx !== -1) {
      allSecIds.splice(origIdx + 1, 0, newSec.id);
      await this.reorderSections(origSec.course_id, allSecIds);
    }

    return {
      id: newSec.id,
      courseId: newSec.course_id,
      title: newSec.title,
      description: newSec.description,
      orderIndex: targetOrder,
      isPublished: newSec.is_published,
      items: duplicatedItems,
    };
  }

  /**
   * Reorder Sections (RPC-only atomic execution)
   */
  static async reorderSections(courseId: string, orderedSectionIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('admin_reorder_course_sections', {
      p_course_id: courseId,
      p_section_ids: orderedSectionIds,
    });

    if (error) {
      console.error('RPC admin_reorder_course_sections failed:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Move an item to a different section and position (RPC-only atomic execution)
   */
  static async moveItem(
    itemId: string,
    sourceSectionId: string,
    destinationSectionId: string,
    destinationIndex: number,
    courseId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_move_lesson', {
      p_course_id: courseId,
      p_lesson_id: itemId,
      p_destination_section_id: destinationSectionId,
      p_destination_index: destinationIndex,
    });

    if (error) {
      console.error('RPC admin_move_lesson failed:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Reorder items inside a section (RPC-only atomic execution)
   */
  static async reorderItems(
    sectionId: string,
    orderedItemIds: string[],
    courseId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_reorder_section_lessons', {
      p_course_id: courseId,
      p_section_id: sectionId,
      p_lesson_ids: orderedItemIds,
    });

    if (error) {
      console.error('RPC admin_reorder_section_lessons failed:', error);
      throw mapCurriculumError(error);
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
   * Delete item (soft delete via RPC)
   */
  static async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_soft_delete_lessons', {
      p_lesson_ids: [itemId],
    });

    if (error) {
      console.error('RPC admin_soft_delete_lessons failed:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Restore soft-deleted item via RPC
   */
  static async restoreItem(itemId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_restore_lessons', {
      p_lesson_ids: [itemId],
    });

    if (error) {
      console.error('RPC admin_restore_lessons failed:', error);
      throw mapCurriculumError(error);
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
      throw mapCurriculumError(error);
    }
  }

  /**
   * Bulk move items to target section (Uses RPC per item or reorder)
   */
  static async bulkMove(itemIds: string[], destinationSectionId: string, courseId: string): Promise<void> {
    if (itemIds.length === 0) return;

    // Get current lessons in destination section to calculate position
    const destLessons = await LessonService.getLessonsBySection(destinationSectionId);
    let startIdx = destLessons.length;

    for (const itemId of itemIds) {
      await this.moveItem(itemId, '', destinationSectionId, startIdx, courseId);
      startIdx++;
    }
  }

  /**
   * Bulk delete items via soft delete RPC
   */
  static async bulkDelete(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;

    const { error } = await supabase.rpc('admin_soft_delete_lessons', {
      p_lesson_ids: itemIds,
    });

    if (error) {
      console.error('RPC admin_soft_delete_lessons failed in bulkDelete:', error);
      throw mapCurriculumError(error);
    }
  }
}

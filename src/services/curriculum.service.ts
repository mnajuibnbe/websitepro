import { supabase } from '../lib/supabase';
import {
  CourseSection,
  Lesson,
  CurriculumItemViewModel,
  CurriculumSectionViewModel,
} from '../types/database.types';
import { LessonService } from './lesson.service';

export interface UpdateSectionInput {
  title?: string;
  description?: string | null;
  isPublished?: boolean;
}

interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function isSupabaseLikeError(value: unknown): value is SupabaseLikeError {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('code' in value || 'message' in value || 'details' in value)
  );
}

/**
 * Maps Supabase / PostgreSQL errors into clean Arabic messages
 */
export function mapCurriculumError(error: unknown): Error {
  if (!error) return new Error('Unable to update the curriculum.');

  let msg = '';
  let code = '';

  if (typeof error === 'string') {
    msg = error;
  } else if (isSupabaseLikeError(error)) {
    msg = error.message || error.details || '';
    code = error.code || '';
  } else if (error instanceof Error) {
    msg = error.message;
  }

  // Function not found (42883 or PGRST202 or missing RPC)
  if (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('Could not find the function') ||
    (msg.includes('function') && msg.includes('does not exist'))
  ) {
    return new Error('The curriculum database migration is not available. Apply the latest Supabase migrations.');
  }

  // Permission denied / RLS
  if (code === '42501' || msg.includes('permission denied') || msg.includes('row-level security') || msg.includes('Access denied')) {
    return new Error('Unable to save the curriculum.');
  }

  // Mismatched course / relation error
  if (
    msg.includes('mismatch') ||
    msg.includes('does not belong to specified course') ||
    msg.includes('Destination section does not belong')
  ) {
    return new Error('Unable to load the curriculum. Please try again.');
  }

  // Deleted item / section error
  if (msg.includes('Section is deleted') || msg.includes('Lesson is deleted') || msg.includes('not found or deleted')) {
    return new Error('The selected lesson could not be found.');
  }

  // Duplicate or constraint violation
  if (code === '23505' || code === '23502' || code === '23503' || msg.includes('Duplicate')) {
    return new Error('Unable to reorder the curriculum items.');
  }

  // Network error
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return new Error('Unable to complete this action. Please review the information and try again.');
  }

  return new Error(msg || 'Unable to process the curriculum request.');
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
      duration: lesson.duration || (lesson.estimated_minutes ? `${lesson.estimated_minutes} Minute` : null),
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
   * Update section fields safely without modifying id, course_id, or order_index
   */
  static async updateSection(sectionId: string, data: UpdateSectionInput): Promise<CourseSection> {
    const payload: { title?: string; description?: string | null; is_published?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.description !== undefined) payload.description = data.description?.trim() || null;
    if (data.isPublished !== undefined) payload.is_published = data.isPublished;

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
   * Duplicate section and lessons atomically via RPC
   */
  static async duplicateSection(courseId: string, sectionId: string): Promise<CurriculumSectionViewModel> {
    const { data: newSecId, error } = await supabase.rpc('admin_duplicate_section', {
      p_course_id: courseId,
      p_section_id: sectionId,
    });

    if (error) {
      console.error('RPC admin_duplicate_section failed:', error);
      throw mapCurriculumError(error);
    }

    const fullCurriculum = await this.getCurriculum(courseId);
    const createdViewModel = fullCurriculum.find((s) => s.id === newSecId);
    if (!createdViewModel) {
      throw new Error('The curriculum section could not be found.');
    }

    return createdViewModel;
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
   * Bulk publish/unpublish active items belonging to specified course
   */
  static async bulkPublish(courseId: string, itemIds: string[], isPublished: boolean): Promise<void> {
    if (itemIds.length === 0) return;
    const { error } = await supabase
      .from('lessons')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq('course_id', courseId)
      .in('id', itemIds)
      .is('deleted_at', null);

    if (error) {
      console.error('Error in bulkPublish:', error);
      throw mapCurriculumError(error);
    }
  }

  /**
   * Bulk move items to target section atomically via RPC
   */
  static async bulkMove(
    courseId: string,
    itemIds: string[],
    destinationSectionId: string,
    destinationIndex = 0
  ): Promise<void> {
    if (itemIds.length === 0) return;

    const { error } = await supabase.rpc('admin_bulk_move_lessons', {
      p_course_id: courseId,
      p_lesson_ids: itemIds,
      p_destination_section_id: destinationSectionId,
      p_destination_index: destinationIndex,
    });

    if (error) {
      console.error('RPC admin_bulk_move_lessons failed:', error);
      throw mapCurriculumError(error);
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

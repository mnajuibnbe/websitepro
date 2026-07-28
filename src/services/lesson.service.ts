import { supabase } from '../lib/supabase';
import { Lesson } from '../types/database.types';

export class LessonService {
  /**
   * Fetch all lessons belonging to a section ordered by order_index ascending.
   */
  static async getLessonsBySection(sectionId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lessons by section:', error);
      throw error;
    }

    return (data || []) as Lesson[];
  }

  /**
   * Fetch all lessons belonging to a course ordered by order_index ascending.
   */
  static async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lessons by course:', error);
      throw error;
    }

    return (data || []) as Lesson[];
  }

  /**
   * Fetch a single lesson by ID.
   */
  static async getLessonById(lessonId: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson by ID:', error);
      throw error;
    }

    return (data as Lesson) || null;
  }

  /**
   * Create a new lesson.
   */
  static async createLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
    if (!lessonData.course_id || !lessonData.section_id || !lessonData.title) {
      throw new Error('Course, section, and lesson title are required.');
    }
    const contentType = lessonData.content_type || lessonData.lesson_type;
    if (!contentType) throw new Error('A supported lesson content type is required.');

    const { data, error } = await supabase.rpc('admin_upsert_lesson', {
      p_course_id: lessonData.course_id,
      p_section_id: lessonData.section_id,
      p_lesson_id: null,
      p_title: lessonData.title,
      p_content_type: contentType,
      p_payload: this.toMutationPayload(lessonData),
      p_expected_version: null,
    });
    if (error) throw error;
    return data as Lesson;
  }

  /**
   * Update an existing lesson.
   */
  static async updateLesson(id: string, lessonData: Partial<Lesson>): Promise<Lesson> {
    const current = await this.getLessonById(id);
    if (!current) throw new Error('Lesson not found.');
    const contentType = lessonData.content_type || lessonData.lesson_type || current.content_type || current.lesson_type;
    if (!contentType) throw new Error('A supported lesson content type is required.');

    const merged = { ...current, ...lessonData };
    const { data, error } = await supabase.rpc('admin_upsert_lesson', {
      p_course_id: current.course_id,
      p_section_id: lessonData.section_id || current.section_id,
      p_lesson_id: id,
      p_title: lessonData.title || current.title,
      p_content_type: contentType,
      p_payload: this.toMutationPayload(merged),
      p_expected_version: lessonData.version ?? current.version ?? null,
    });
    if (error) throw error;
    return data as Lesson;
  }

  private static toMutationPayload(lessonData: Partial<Lesson>): Record<string, unknown> {
    return {
      description: lessonData.description ?? null,
      content: lessonData.content ?? null,
      video_url: lessonData.video_url ?? null,
      content_url: lessonData.content_url ?? null,
      transcript: lessonData.transcript ?? null,
      captions_url: lessonData.captions_url ?? null,
      notes: lessonData.notes ?? null,
      pdf_allow_download: lessonData.pdf_allow_download ?? true,
      pdf_watermark: lessonData.pdf_watermark ?? false,
      open_in_new_tab: lessonData.open_in_new_tab ?? false,
      is_preview: lessonData.is_preview ?? false,
      is_published: lessonData.is_published ?? true,
      completion_rule: lessonData.completion_rule ?? null,
    };
  }

  /**
   * Duplicate a lesson with " (Details)" appended to title and placed directly after the source lesson.
   */
  static async duplicateLesson(lessonId: string): Promise<Lesson> {
    const { data, error } = await supabase.rpc('admin_duplicate_lesson', { p_lesson_id: lessonId });
    if (error) throw error;
    return data as Lesson;
  }

  /**
   * Delete a lesson and re-index order_index for remaining lessons in section automatically.
   */
  static async deleteLesson(lessonId: string, sectionId?: string): Promise<void> {
    void sectionId;
    const { error } = await supabase.rpc('admin_soft_delete_lessons', { p_lesson_ids: [lessonId] });
    if (error) throw error;
  }

  /**
   * Reorder lessons within a section by an ordered array of lesson IDs.
   */
  static async reorderLessons(sectionId: string, orderedLessonIds: string[]): Promise<void> {
    if (orderedLessonIds.length === 0) return;
    const first = await this.getLessonById(orderedLessonIds[0]);
    if (!first) throw new Error('Lesson not found.');
    const { error } = await supabase.rpc('admin_reorder_section_lessons', {
      p_course_id: first.course_id,
      p_section_id: sectionId,
      p_lesson_ids: orderedLessonIds,
    });
    if (error) throw error;
  }
}

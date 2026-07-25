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
    const payload: Record<string, any> = {
      course_id: lessonData.course_id,
      section_id: lessonData.section_id || null,
      title: lessonData.title?.trim(),
      slug: lessonData.slug?.trim() || null,
      description: lessonData.description?.trim() || null,
      content: lessonData.content || null,
      video_url: lessonData.video_url?.trim() || null,
      content_url: lessonData.content_url?.trim() || null,
      type: lessonData.lesson_type || lessonData.type || 'video',
      lesson_type: lessonData.lesson_type || lessonData.type || 'video',
      duration: lessonData.duration?.trim() || null,
      estimated_minutes: lessonData.estimated_minutes ?? (lessonData.duration ? parseInt(lessonData.duration) || 0 : 0),
      thumbnail: lessonData.thumbnail?.trim() || null,
      attachments: lessonData.attachments || [],
      order_index: lessonData.order_index ?? 0,
      is_preview: Boolean(lessonData.is_preview),
      is_published: lessonData.is_published ?? true,
      completion_rule: lessonData.completion_rule || 'manual',
      seo_title: lessonData.seo_title?.trim() || null,
      seo_description: lessonData.seo_description?.trim() || null,
      transcript: lessonData.transcript || null,
      captions_url: lessonData.captions_url || null,
      notes: lessonData.notes || null,
      pdf_allow_download: lessonData.pdf_allow_download ?? true,
      pdf_watermark: lessonData.pdf_watermark ?? false,
      open_in_new_tab: lessonData.open_in_new_tab ?? false,
      embed_code: lessonData.embed_code || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as Lesson;
    } catch (err: any) {
      // If error is due to missing columns in DB schema, attempt with standard fallback schema fields
      if (err.code === '42703' || err.message?.includes('column')) {
        console.warn('Fallback inserting lesson with core fields due to schema variance:', err.message);
        const corePayload = {
          course_id: payload.course_id,
          section_id: payload.section_id,
          title: payload.title,
          description: payload.description,
          content: payload.content,
          video_url: payload.video_url,
          type: payload.type === 'article' || payload.type === 'pdf' ? 'text' : payload.type === 'quiz' ? 'quiz' : 'video',
          duration: payload.duration,
          order_index: payload.order_index,
          is_preview: payload.is_preview,
          is_published: payload.is_published,
        };

        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('lessons')
          .insert(corePayload)
          .select()
          .single();

        if (fallbackErr) throw fallbackErr;
        return fallbackData as Lesson;
      }
      throw err;
    }
  }

  /**
   * Update an existing lesson.
   */
  static async updateLesson(id: string, lessonData: Partial<Lesson>): Promise<Lesson> {
    const payload: Record<string, any> = {
      title: lessonData.title?.trim(),
      slug: lessonData.slug?.trim() || null,
      description: lessonData.description?.trim() || null,
      content: lessonData.content || null,
      video_url: lessonData.video_url?.trim() || null,
      content_url: lessonData.content_url?.trim() || null,
      type: lessonData.lesson_type || lessonData.type,
      lesson_type: lessonData.lesson_type || lessonData.type,
      duration: lessonData.duration?.trim() || null,
      estimated_minutes: lessonData.estimated_minutes,
      thumbnail: lessonData.thumbnail?.trim() || null,
      attachments: lessonData.attachments,
      order_index: lessonData.order_index,
      is_preview: lessonData.is_preview,
      is_published: lessonData.is_published,
      completion_rule: lessonData.completion_rule,
      seo_title: lessonData.seo_title?.trim() || null,
      seo_description: lessonData.seo_description?.trim() || null,
      transcript: lessonData.transcript || null,
      captions_url: lessonData.captions_url || null,
      notes: lessonData.notes || null,
      pdf_allow_download: lessonData.pdf_allow_download,
      pdf_watermark: lessonData.pdf_watermark,
      open_in_new_tab: lessonData.open_in_new_tab,
      embed_code: lessonData.embed_code || null,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lesson;
    } catch (err: any) {
      if (err.code === '42703' || err.message?.includes('column')) {
        console.warn('Fallback updating lesson with core fields due to schema variance:', err.message);
        const corePayload: Record<string, any> = {
          title: payload.title,
          description: payload.description,
          content: payload.content,
          video_url: payload.video_url,
          duration: payload.duration,
          is_preview: payload.is_preview,
          is_published: payload.is_published,
          updated_at: payload.updated_at,
        };
        if (payload.type) {
          corePayload.type = payload.type === 'article' || payload.type === 'pdf' ? 'text' : payload.type === 'quiz' ? 'quiz' : 'video';
        }
        Object.keys(corePayload).forEach((key) => {
          if (corePayload[key] === undefined) delete corePayload[key];
        });

        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('lessons')
          .update(corePayload)
          .eq('id', id)
          .select()
          .single();

        if (fallbackErr) throw fallbackErr;
        return fallbackData as Lesson;
      }
      throw err;
    }
  }

  /**
   * Duplicate a lesson with " (نسخة)" appended to title and placed directly after the source lesson.
   */
  static async duplicateLesson(lessonId: string): Promise<Lesson> {
    const original = await this.getLessonById(lessonId);
    if (!original) {
      throw new Error('الدرس المطلوب غير موجود.');
    }

    const targetOrder = (original.order_index ?? 0) + 1;

    // Shift subsequent lessons order if any in section
    if (original.section_id) {
      const existingLessons = await this.getLessonsBySection(original.section_id);
      const lessonsToShift = existingLessons.filter((l) => l.order_index >= targetOrder);

      for (const l of lessonsToShift) {
        await supabase
          .from('lessons')
          .update({ order_index: l.order_index + 1 })
          .eq('id', l.id);
      }
    }

    const duplicatedData: Partial<Lesson> = {
      ...original,
      id: undefined,
      title: `${original.title} (نسخة)`,
      slug: original.slug ? `${original.slug}-copy-${Date.now()}` : null,
      order_index: targetOrder,
      created_at: undefined,
      updated_at: undefined,
    };

    return await this.createLesson(duplicatedData);
  }

  /**
   * Delete a lesson and re-index order_index for remaining lessons in section automatically.
   */
  static async deleteLesson(lessonId: string, sectionId?: string): Promise<void> {
    let secId = sectionId;

    if (!secId) {
      const lesson = await this.getLessonById(lessonId);
      secId = lesson?.section_id || undefined;
    }

    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }

    // Auto re-index remaining lessons in section
    if (secId) {
      const remainingLessons = await this.getLessonsBySection(secId);
      for (let i = 0; i < remainingLessons.length; i++) {
        if (remainingLessons[i].order_index !== i) {
          await supabase
            .from('lessons')
            .update({ order_index: i })
            .eq('id', remainingLessons[i].id);
        }
      }
    }
  }

  /**
   * Reorder lessons within a section by an ordered array of lesson IDs.
   */
  static async reorderLessons(sectionId: string, orderedLessonIds: string[]): Promise<void> {
    for (let index = 0; index < orderedLessonIds.length; index++) {
      const lessonId = orderedLessonIds[index];
      const { error } = await supabase
        .from('lessons')
        .update({ order_index: index, section_id: sectionId })
        .eq('id', lessonId);

      if (error) {
        console.error(`Error reordering lesson ${lessonId}:`, error);
      }
    }
  }
}

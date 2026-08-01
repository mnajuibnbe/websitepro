import { supabase } from '../lib/supabase';

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchCourseCategories(includeInactive = false): Promise<CourseCategory[]> {
  const result = includeInactive
    ? await supabase.rpc('admin_list_course_categories')
    : await supabase
      .from('course_categories')
      .select('id,name,slug,description,is_active,display_order,created_at,updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

  if (result.error) throw result.error;
  return (result.data || []) as CourseCategory[];
}

export async function saveCourseCategory(input: Pick<CourseCategory, 'name' | 'display_order' | 'is_active'> & { id?: number | null }) {
  const { data, error } = await supabase.rpc('admin_save_course_category', {
    p_id: input.id ?? null,
    p_name: input.name,
    p_display_order: input.display_order,
    p_is_active: input.is_active,
  });
  if (error) throw error;
  return data as CourseCategory;
}

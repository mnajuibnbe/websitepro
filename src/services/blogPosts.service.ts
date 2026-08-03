import { supabase } from '../lib/supabase';

export type BlogPostStatus = 'draft' | 'published';
export interface BlogPost { id: number; slug: string; title: string; excerpt: string; cover_image_url: string | null; status: BlogPostStatus; published_at: string | null; created_at: string; updated_at: string; }
export type BlogPostInput = Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'status' | 'published_at'>;

export async function fetchPublishedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as BlogPost[];
}

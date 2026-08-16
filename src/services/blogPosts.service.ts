import { supabase } from '../lib/supabase';

export type BlogPostStatus = 'draft' | 'published';
export type BlogSearchIntent = 'informational' | 'how_to' | 'comparison' | 'commercial_investigation' | 'transactional' | 'navigational';

/** Original Value Checker: fixed, self-reported signals — never auto-detected. */
export const ORIGINAL_VALUE_SIGNALS = [
  { key: 'personal_experience', label: 'Personal experience' },
  { key: 'original_research', label: 'Original research' },
  { key: 'data', label: 'Data' },
  { key: 'screenshots', label: 'Screenshots' },
  { key: 'case_study', label: 'Case study' },
  { key: 'expert_opinion', label: 'Expert opinion' },
  { key: 'original_examples', label: 'Original examples' },
  { key: 'testing_results', label: 'Testing results' },
  { key: 'unique_process', label: 'Unique process' },
] as const;
export type OriginalValueSignal = (typeof ORIGINAL_VALUE_SIGNALS)[number]['key'];

export interface BlogSource { name: string; url: string; accessedDate: string }

export interface BlogPost { id: number; slug: string; title: string; excerpt: string; content: string; cover_image_url: string | null; status: BlogPostStatus; published_at: string | null; created_at: string; updated_at: string; seo_title: string | null; meta_description: string | null; primary_keyword: string | null; secondary_keywords: string[]; search_intent: BlogSearchIntent | null; original_value_signals: OriginalValueSignal[]; sources: BlogSource[]; }
export type BlogPostInput = Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'content' | 'cover_image_url' | 'status' | 'published_at' | 'seo_title' | 'meta_description' | 'primary_keyword' | 'secondary_keywords' | 'search_intent' | 'original_value_signals' | 'sources'>;

export async function fetchPublishedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as BlogPost[];
}

export async function fetchPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data as BlogPost | null;
}

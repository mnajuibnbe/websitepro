import { supabase } from '../lib/supabase';

export interface TopicSubtopic { topic: string; covered: boolean }
export interface TopicInsights { subtopics: TopicSubtopic[]; questions: string[] }

/** Thrown when the server reports the feature itself isn't configured/available (503) — distinct from a one-off request failure, so the panel can show a clear "not available" state instead of a generic error. */
export class BlogInsightsUnavailableError extends Error {}

interface TopicInsightsResponsePayload extends Partial<TopicInsights> {
  error?: string;
}

/** Calls the server-side Gemini proxy (POST /api/blog/topic-insights). The API key never reaches the browser. */
export async function fetchTopicInsights(topic: string, contentText: string): Promise<TopicInsights> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch('/api/blog/topic-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify({ topic, contentText }),
  });
  const payload = await response.json().catch(() => null) as TopicInsightsResponsePayload | null;

  if (response.status === 503) {
    throw new BlogInsightsUnavailableError(payload?.error || 'AI-assisted insights are not available right now.');
  }
  if (!response.ok) {
    throw new Error(payload?.error || 'Could not analyze this article.');
  }
  if (!payload || !Array.isArray(payload.subtopics) || !Array.isArray(payload.questions)) {
    throw new Error('Received an unexpected response from the insights service.');
  }
  return { subtopics: payload.subtopics, questions: payload.questions };
}

interface MetaDescriptionResponsePayload { description?: string; error?: string }

/**
 * Calls the server-side Gemini proxy that writes the article's meta description
 * automatically (POST /api/blog/meta-description) -- see AdminBlogPosts.tsx's save().
 * Returns null on any failure (missing key, rate limit, API error) rather than throwing,
 * so a Gemini hiccup never blocks saving the post -- the caller just keeps whatever
 * meta_description was already stored.
 */
export async function fetchMetaDescription(title: string, excerpt: string, contentText: string, primaryKeyword: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const response = await fetch('/api/blog/meta-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
      body: JSON.stringify({ title, excerpt, contentText, primaryKeyword }),
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null) as MetaDescriptionResponsePayload | null;
    return payload?.description?.trim() || null;
  } catch {
    return null;
  }
}

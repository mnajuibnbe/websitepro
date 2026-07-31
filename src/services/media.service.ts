import { supabase } from '../lib/supabase';

export interface VideoMetadataResult { provider: string; durationSeconds: number | null; status: 'pending' | 'ready' | 'unavailable' | 'failed'; }
export interface PdfMetadataResult { provider: 'google_drive'; name: string; size: number; status: 'ready'; }

export class MediaService {
  static async inspectVideo(url: string): Promise<VideoMetadataResult> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Your session expired. Sign in and try again.');
    const response = await fetch('/api/media/video-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ url }) });
    const payload = await response.json() as VideoMetadataResult & { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Video metadata could not be loaded.');
    return payload;
  }

  static async persistVideoMetadata(lessonId: string, url: string, metadata: VideoMetadataResult): Promise<void> {
    const { error } = await supabase.rpc('admin_set_lesson_video_metadata', { p_lesson_id: lessonId, p_video_url: url, p_provider: metadata.provider, p_duration_seconds: metadata.durationSeconds, p_status: metadata.status });
    if (error) throw error;
  }

  static async inspectPdf(url: string): Promise<PdfMetadataResult> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Your session expired. Sign in and try again.');
    const response = await fetch('/api/media/document-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json() as PdfMetadataResult & { error?: string };
    if (!response.ok) throw new Error(payload.error || 'PDF metadata could not be loaded.');
    return payload;
  }
}

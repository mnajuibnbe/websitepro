import React from 'react';
import { VideoOff } from 'lucide-react';
import { VideoProviderResolver } from '../video/VideoProviderResolver';
import { useAuth } from '../../contexts/AuthContext';
import { useLessonPlaybackPosition } from '../../hooks/useLessonPlaybackPosition';

interface VideoLessonRendererProps {
  lessonId: string;
  videoUrl: string | null;
  title: string;
  publicPreview?: boolean;
  /** Required for cross-session resume; omit (e.g. public preview) to disable it. */
  courseId?: string;
  /** The student's last saved position for this lesson, or null if never started. */
  initialPositionSeconds?: number | null;
}

function detectProvider(url: string | null): string {
  if (!url || !url.trim()) return 'none';
  const cleanUrl = url.trim();

  if (cleanUrl.match(/drive\.google\.com/)) return 'google_drive';

  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) return 'youtube';

  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch) return 'vimeo';

  return 'mp4';
}

export function VideoLessonRenderer({ lessonId, videoUrl, title, publicPreview = false, courseId, initialPositionSeconds = null }: VideoLessonRendererProps) {
  const provider = detectProvider(videoUrl);
  const { user } = useAuth();
  const playback = useLessonPlaybackPosition({
    userId: user?.id,
    courseId,
    lessonId,
    initialPositionSeconds,
    enabled: !publicPreview,
  });

  if (provider === 'none' || !videoUrl) {
    return (
      <div className="relative w-full aspect-video bg-primary-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center text-white border border-primary-800 shadow-md">
        <div className="w-16 h-16 bg-primary-900/80 rounded-full flex items-center justify-center text-primary-400 mb-3 border border-primary-800">
          <VideoOff className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold mb-1 text-primary-100">Video unavailable</h3>
        <p className="text-sm text-primary-400 max-w-md">
          This lesson does not have a playable video yet.
        </p>
      </div>
    );
  }

  return (
    <VideoProviderResolver
      lessonId={lessonId}
      videoUrl={videoUrl}
      provider={provider}
      title={title}
      publicPreview={publicPreview}
      initialPositionSeconds={playback.startAt}
      resumeSkipThresholdSeconds={playback.resumeSkipThresholdSeconds}
      onTimeUpdate={playback.onTimeUpdate}
      onPlaybackStateChange={playback.onPlaybackStateChange}
    />
  );
}

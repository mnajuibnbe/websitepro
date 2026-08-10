import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { SecureStreamProvider } from './SecureStreamProvider';

interface VideoProviderResolverProps {
  lessonId: string;
  videoUrl: string;
  provider: 'youtube' | 'vimeo' | 'mp4' | 'google_drive' | string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
  publicPreview?: boolean;
}

function getYoutubeEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=0`;
  }
  return url;
}

function getVimeoEmbedUrl(url: string): string {
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

export const VideoProviderResolver: React.FC<VideoProviderResolverProps> = ({
  lessonId,
  videoUrl,
  provider,
  title,
  poster,
  onEnded,
  publicPreview = false,
}) => {
  if (import.meta.env.DEV) console.log(`[DevLog] Provider detected: ${provider} for lessonId: ${lessonId}`);

  // If it's google_drive, we use our SecureStreamProvider to fetch token and stream
  if (provider === 'google_drive' || videoUrl.includes('drive.google.com')) {
    return (
      <SecureStreamProvider
        lessonId={lessonId}
        title={title}
        poster={poster}
        onEnded={onEnded}
        publicPreview={publicPreview}
      />
    );
  }

  // Preserve existing behavior for YouTube exactly
  if (provider === 'youtube') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-primary-900">
        <iframe
          src={getYoutubeEmbedUrl(videoUrl)}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Preserve existing behavior for Vimeo exactly
  if (provider === 'vimeo') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-primary-900">
        <iframe
          src={getVimeoEmbedUrl(videoUrl)}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Determine standard src for Vidstack (MP4)
  return (
    <VideoPlayer
      src={videoUrl}
      title={title}
      poster={poster}
      onEnded={onEnded}
    />
  );
};

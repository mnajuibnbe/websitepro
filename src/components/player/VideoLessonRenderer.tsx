import React from 'react';
import { VideoOff } from 'lucide-react';
import { VideoProviderResolver } from '../video/VideoProviderResolver';

interface VideoLessonRendererProps {
  lessonId: string;
  videoUrl: string | null;
  title: string;
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

export function VideoLessonRenderer({ lessonId, videoUrl, title }: VideoLessonRendererProps) {
  const provider = detectProvider(videoUrl);

  if (provider === 'none' || !videoUrl) {
    return (
      <div className="relative w-full aspect-video bg-primary-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center text-white border border-primary-800 shadow-md">
        <div className="w-16 h-16 bg-primary-900/80 rounded-full flex items-center justify-center text-primary-400 mb-3 border border-primary-800">
          <VideoOff className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold mb-1 text-primary-100">فيديو الدرس غير متوفر حالياً</h3>
        <p className="text-sm text-primary-400 max-w-md">
          لم يتم تضمين رابط فيديو صالح لهذا الدرس بعد. يمكنك قراءة التفاصيل المرفقة أدناه.
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
    />
  );
}

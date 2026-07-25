import React from 'react';
import { VideoOff, AlertCircle } from 'lucide-react';

interface VideoLessonRendererProps {
  videoUrl: string | null;
  title: string;
}

function getEmbedUrl(url: string | null): { type: 'embed' | 'direct' | 'none'; src: string } {
  if (!url || !url.trim()) return { type: 'none', src: '' };

  const cleanUrl = url.trim();

  // YouTube matchers
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'embed',
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=0`
    };
  }

  // Vimeo matchers
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'embed',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Direct MP4 or video files
  if (cleanUrl.match(/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i) || cleanUrl.startsWith('http')) {
    // If it's a standard URL, check if it's embeddable or direct
    if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm')) {
      return { type: 'direct', src: cleanUrl };
    }
    // Fallback embed for generic URL
    return { type: 'embed', src: cleanUrl };
  }

  return { type: 'none', src: '' };
}

export function VideoLessonRenderer({ videoUrl, title }: VideoLessonRendererProps) {
  const { type, src } = getEmbedUrl(videoUrl);

  if (type === 'none' || !src) {
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
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-primary-900">
      {type === 'embed' ? (
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          src={src}
          controls
          className="w-full h-full object-contain"
          controlsList="nodownload"
        >
          متصفحك لا يدعم تشغيل هذا الفيديو.
        </video>
      )}
    </div>
  );
}

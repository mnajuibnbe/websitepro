import React, { Component, ReactNode } from 'react';
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { AlertCircle } from 'lucide-react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// WORKAROUND: Vidstack has a bug where it attempts to `JSON.stringify()` DOM Events 
// (like media 'error' events) which contain circular references (target -> FiberNode -> stateNode).
// This causes a fatal "Converting circular structure to JSON" TypeError.
// By providing a `toJSON` method on Event, we prevent the circular reference crash.
if (typeof Event !== 'undefined' && !('toJSON' in Event.prototype)) {
  Object.defineProperty(Event.prototype, 'toJSON', {
    value: function () {
      return { type: this.type, isTrusted: this.isTrusted };
    },
    configurable: true,
    writable: true,
  });
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  autoPlay?: boolean;
}

class VideoPlayerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  declare props: Readonly<{ children: ReactNode }>;
  declare state: Readonly<{ hasError: boolean }>;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[VideoPlayerErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-video bg-black flex flex-col items-center justify-center p-6 border border-red-900/30 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-400 mb-2">تعذر تشغيل الفيديو</h3>
          <p className="text-red-200 text-center max-w-md">حدث خطأ أثناء محاولة تحميل أو تشغيل مشغل الفيديو. قد يكون الرابط غير صالح.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  onEnded,
  onTimeUpdate,
  autoPlay = false,
}) => {
  const playerRef = React.useRef<MediaPlayerInstance>(null);

  // Temporary developer log for stream start
  React.useEffect(() => {
    if (src) {
      console.log(`[DevLog] Stream started: ${src}`);
    }
  }, [src]);

  const handleTimeUpdate = (time: number) => {
    // console.log("[DevLog] handleTimeUpdate:", typeof time, time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };

  const handleEnded = () => {
    console.log('[DevLog] Stream ended');
    if (onEnded) {
      onEnded();
    }
  };

  const handleError = (e: any) => {
    console.error('[DevLog] MediaPlayer encountered an error', e?.message || e?.detail?.message || e?.target?.error?.code || 'Unknown player error');
  };

  return (
    <VideoPlayerErrorBoundary>
      <div className="w-full h-full bg-black rounded-lg overflow-hidden group">
        <MediaPlayer
          ref={playerRef}
          src={src}
          title={title}
          autoPlay={autoPlay}
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTime)}
          onEnd={handleEnded}
          onError={handleError}
          className="w-full aspect-video"
        >
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>
    </VideoPlayerErrorBoundary>
  );
};

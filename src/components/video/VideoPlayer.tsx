import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

export interface VideoPlayerProps {
  src: string; poster?: string; title?: string; onEnded?: () => void;
  onTimeUpdate?: (time: number) => void; autoPlay?: boolean;
  fill?: boolean;
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
}

export function VideoPlayer({ src, poster, title, onEnded, onTimeUpdate, autoPlay = false, fill = false }: VideoPlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => { setPlaying(false); setCurrentTime(0); setDuration(0); setError(false); }, [src]);
  const togglePlayback = async () => { const video = videoRef.current; if (!video) return; if (video.paused) await video.play(); else video.pause(); };
  const toggleFullscreen = async () => { if (!frameRef.current) return; if (document.fullscreenElement) await document.exitFullscreen(); else await frameRef.current.requestFullscreen(); };

  if (error) return <div role="alert" className={`flex w-full items-center justify-center bg-primary-950 p-8 text-center text-primary-100 ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>This video could not be played. Please try again.</div>;

  return <div ref={frameRef} className={`group relative w-full overflow-hidden bg-black shadow-lg ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>
    <video ref={videoRef} src={src} poster={poster} title={title} aria-label={title || 'Tutiba video'} autoPlay={autoPlay} playsInline preload="metadata" controls={false} controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture onClick={() => void togglePlayback()} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onDurationChange={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => { setCurrentTime(event.currentTarget.currentTime); onTimeUpdate?.(event.currentTarget.currentTime); }} onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)} onEnded={() => { setPlaying(false); onEnded?.(); }} onError={() => setError(true)} className="h-full w-full object-contain" />
    {!playing && <button type="button" onClick={() => void togglePlayback()} aria-label="Play video" className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-600/95 text-white shadow-2xl transition hover:scale-105 hover:bg-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-300/60"><Play className="h-8 w-8 fill-current ms-1" /></button>}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950 via-primary-950/90 to-transparent px-3 pb-3 pt-10 text-white md:px-5 md:pb-4">
      <label className="block"><span className="sr-only">Seek video</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={event => { const next = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = next; setCurrentTime(next); }} className="h-1.5 w-full cursor-pointer accent-accent-500" /></label>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10">{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</button>
        <button type="button" onClick={() => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setVolume(videoRef.current.muted ? 0 : videoRef.current.volume); }} aria-label={volume === 0 ? 'Unmute video' : 'Mute video'} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10">{volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
        <label className="hidden sm:block"><span className="sr-only">Volume</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const next = Number(event.target.value); if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = next; } setVolume(next); }} className="w-24 accent-accent-500" /></label>
        <span className="ml-1 text-xs font-semibold tabular-nums text-primary-100">{formatTime(currentTime)} / {formatTime(duration)}</span>
        <button type="button" onClick={() => void toggleFullscreen()} aria-label="Enter fullscreen" className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"><Maximize className="h-5 w-5" /></button>
      </div>
    </div>
  </div>;
}

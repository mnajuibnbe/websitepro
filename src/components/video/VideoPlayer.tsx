import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

export interface VideoPlayerProps {
  src: string; poster?: string; title?: string; onEnded?: () => void;
  onTimeUpdate?: (time: number) => void; autoPlay?: boolean;
  fill?: boolean;
  controls?: 'full' | 'playback-only';
  /** Seconds to seek to once the (possibly renewed) source has loaded metadata. */
  startAt?: number;
  /** Resume playback once seeked to startAt, e.g. after a token renewal mid-playback. */
  resumePlaying?: boolean;
  /** Reported on every play/pause so a parent can remember playback state across a src swap. */
  onPlaybackStateChange?: (playing: boolean) => void;
  /**
   * Playback error hook. When provided, the parent owns error handling/recovery and this
   * component will NOT render its own dead-end error state for a native <video> error.
   */
  onPlaybackError?: () => void;
  /** Shows a small non-blocking "reconnecting" indicator without hiding the current frame. */
  reconnecting?: boolean;
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
}

export function VideoPlayer({ src, poster, title, onEnded, onTimeUpdate, autoPlay = false, fill = false, controls = 'full', startAt, resumePlaying = false, onPlaybackStateChange, onPlaybackError, reconnecting = false }: VideoPlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { setPlaying(false); setCurrentTime(0); setDuration(0); setBuffering(true); setError(false); }, [src]);
  const togglePlayback = async () => { const video = videoRef.current; if (!video) return; if (video.paused) await video.play(); else video.pause(); };
  const toggleFullscreen = async () => { if (!frameRef.current) return; if (document.fullscreenElement) await document.exitFullscreen(); else await frameRef.current.requestFullscreen(); };
  const handleError = () => { if (onPlaybackError) onPlaybackError(); else setError(true); };

  if (error) return <div role="alert" className={`flex w-full items-center justify-center bg-primary-950 p-8 text-center text-primary-100 ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>This video could not be played. Please try again.</div>;

  return <div ref={frameRef} className={`group relative w-full overflow-hidden bg-black shadow-lg ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>
    <video ref={videoRef} src={src} poster={poster} title={title} aria-label={title || 'Tutiba video'} autoPlay={autoPlay} playsInline preload="metadata" controls={false} controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture onClick={() => void togglePlayback()} onPlay={() => { setPlaying(true); onPlaybackStateChange?.(true); }} onPlaying={() => setBuffering(false)} onPause={() => { setPlaying(false); onPlaybackStateChange?.(false); }} onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)} onSeeked={() => setBuffering(false)} onLoadedMetadata={event => { const videoElement = event.currentTarget; setDuration(videoElement.duration || 0); if (startAt !== undefined) { videoElement.currentTime = startAt; setCurrentTime(startAt); } if (resumePlaying) void videoElement.play().catch(() => undefined); }} onDurationChange={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => { setCurrentTime(event.currentTarget.currentTime); onTimeUpdate?.(event.currentTarget.currentTime); }} onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)} onEnded={() => { setPlaying(false); onEnded?.(); }} onError={handleError} className="h-full w-full object-contain" />
    {buffering && <div role="status" aria-label="Loading video" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary-950/35"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-300/30 bg-primary-950/80 shadow-xl backdrop-blur"><span className="h-7 w-7 animate-spin rounded-full border-[3px] border-accent-200 border-t-accent-600" /></span></div>}
    {reconnecting && <div role="status" aria-label="Reconnecting" className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center"><span className="rounded-full bg-primary-950/85 px-3 py-1 text-xs font-semibold text-primary-100 shadow-lg backdrop-blur">Reconnecting…</span></div>}
    {controls === 'full' && !playing && !buffering && <button type="button" onClick={() => void togglePlayback()} aria-label="Play video" className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-600/95 text-white shadow-2xl transition hover:scale-105 hover:bg-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-300/60 sm:h-16 sm:w-16"><Play className="h-6 w-6 fill-current ms-1 sm:h-7 sm:w-7" /></button>}
    {controls === 'playback-only' ? <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-primary-950 via-primary-950/70 to-transparent px-3 pb-3 pt-10 text-white">
      <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-11 min-w-11 items-center justify-center rounded-full bg-primary-950/80 px-4 shadow-lg backdrop-blur hover:bg-primary-950 focus:outline-none focus:ring-4 focus:ring-accent-300/60">{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ms-0.5" />}</button>
    </div> : <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-primary-950 via-primary-950/90 to-transparent px-3 pb-2 pt-8 text-white md:px-5 md:pb-3">
      <label className="block"><span className="sr-only">Seek video</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={event => { const next = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = next; setCurrentTime(next); }} className="h-1.5 w-full cursor-pointer accent-accent-500" /></label>
      <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
        <button type="button" onClick={() => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setVolume(videoRef.current.muted ? 0 : videoRef.current.volume); }} aria-label={volume === 0 ? 'Unmute video' : 'Mute video'} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        <label className="hidden sm:block"><span className="sr-only">Volume</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const next = Number(event.target.value); if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = next; } setVolume(next); }} className="w-24 accent-accent-500" /></label>
        <span className="ml-1 text-xs font-semibold tabular-nums text-primary-100">{formatTime(currentTime)} / {formatTime(duration)}</span>
        <button type="button" onClick={() => void toggleFullscreen()} aria-label="Enter fullscreen" className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"><Maximize className="h-4 w-4" /></button>
      </div>
    </div>}
  </div>;
}

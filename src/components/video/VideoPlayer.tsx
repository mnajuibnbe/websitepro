import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2] as const;

interface BufferedRange { start: number; end: number; }

function getBufferedRanges(video: HTMLVideoElement): BufferedRange[] {
  const ranges: BufferedRange[] = [];
  for (let index = 0; index < video.buffered.length; index += 1) {
    ranges.push({ start: video.buffered.start(index), end: video.buffered.end(index) });
  }
  return ranges;
}

interface ScrubberProps {
  currentTime: number;
  duration: number;
  buffered: BufferedRange[];
  onSeek: (time: number) => void;
  formatTime: (value: number) => string;
}

function Scrubber({ currentTime, duration, buffered, onSeek, formatTime }: ScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const safeDuration = duration || 0;
  const playedRatio = safeDuration ? Math.min(currentTime / safeDuration, 1) : 0;

  const ratioFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return 0;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  };

  const seekToRatio = (ratio: number) => {
    if (!safeDuration) return;
    onSeek(Math.min(Math.max(ratio * safeDuration, 0), safeDuration));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    const ratio = ratioFromClientX(event.clientX);
    setHoverRatio(ratio);
    seekToRatio(ratio);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const ratio = ratioFromClientX(event.clientX);
    setHoverRatio(ratio);
    if (isDragging) seekToRatio(ratio);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!safeDuration) return;
    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onSeek(Math.min(currentTime + step, safeDuration)); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onSeek(Math.max(currentTime - step, 0)); }
    else if (event.key === 'Home') { event.preventDefault(); onSeek(0); }
    else if (event.key === 'End') { event.preventDefault(); onSeek(safeDuration); }
  };

  return <div
    ref={trackRef}
    role="slider"
    tabIndex={0}
    aria-label="Seek video"
    aria-orientation="horizontal"
    aria-valuemin={0}
    aria-valuemax={safeDuration}
    aria-valuenow={Math.min(currentTime, safeDuration)}
    aria-valuetext={formatTime(currentTime)}
    className="relative flex h-5 w-full touch-none select-none items-center outline-none focus-visible:ring-2 focus-visible:ring-accent-300/60 rounded"
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={stopDragging}
    onPointerCancel={stopDragging}
    onPointerLeave={() => { if (!isDragging) setHoverRatio(null); }}
    onKeyDown={handleKeyDown}
  >
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      {buffered.map((range, index) => {
        const startPct = safeDuration ? (Math.min(range.start, safeDuration) / safeDuration) * 100 : 0;
        const endPct = safeDuration ? (Math.min(range.end, safeDuration) / safeDuration) * 100 : 0;
        return <div key={index} className="absolute inset-y-0 rounded-full bg-white/40" style={{ left: `${startPct}%`, width: `${Math.max(endPct - startPct, 0)}%` }} />;
      })}
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent-500" style={{ width: `${playedRatio * 100}%` }} />
    </div>
    <div className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${playedRatio * 100}%` }} />
    {hoverRatio !== null && safeDuration > 0 && <div className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-primary-900 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-lg" style={{ left: `${hoverRatio * 100}%` }}>{formatTime(hoverRatio * safeDuration)}</div>}
  </div>;
}

interface SpeedMenuProps {
  rate: number;
  onChange: (rate: number) => void;
}

function SpeedMenu({ rate, onChange }: SpeedMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const currentIndex = PLAYBACK_RATES.indexOf(rate as (typeof PLAYBACK_RATES)[number]);
    setActiveIndex(currentIndex === -1 ? 0 : currentIndex);
    listRef.current?.focus();
  }, [open, rate]);

  const closeAndFocusButton = () => { setOpen(false); buttonRef.current?.focus(); };

  const selectActive = () => {
    const value = PLAYBACK_RATES[activeIndex];
    if (value !== undefined) onChange(value);
    closeAndFocusButton();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); closeAndFocusButton(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, PLAYBACK_RATES.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
    else if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === 'End') { event.preventDefault(); setActiveIndex(PLAYBACK_RATES.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectActive(); }
    else if (event.key === 'Tab') { setOpen(false); }
  };

  return <div ref={containerRef} className="relative">
    <button ref={buttonRef} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 bg-primary-900/90 px-2 text-xs font-semibold text-primary-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-300/60">{rate}x</button>
    {open && <ul ref={listRef} role="listbox" aria-label="Playback speed" aria-activedescendant={`playback-rate-${PLAYBACK_RATES[activeIndex]}`} tabIndex={0} onKeyDown={handleKeyDown} className="absolute bottom-full right-0 z-30 mb-2 w-20 overflow-hidden rounded-lg border border-white/10 bg-primary-900 py-1 text-primary-100 shadow-2xl outline-none">
      {PLAYBACK_RATES.map((option, index) => <li key={option} id={`playback-rate-${option}`} role="option" aria-selected={option === rate} onMouseEnter={() => setActiveIndex(index)} onClick={() => { onChange(option); closeAndFocusButton(); }} className={`cursor-pointer px-3 py-1.5 text-xs font-semibold ${index === activeIndex ? 'bg-accent-600 text-white' : 'text-primary-100 hover:bg-white/10'}`}>{option}x</li>)}
    </ul>}
  </div>;
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

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
  const pendingPlayIntentRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);

  useEffect(() => { setPlaying(false); setCurrentTime(0); setDuration(0); setBuffering(true); setError(false); setBufferedRanges([]); pendingPlayIntentRef.current = false; }, [src]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = playbackRate; }, [playbackRate, src]);
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsDoc = document as FullscreenDocument;
      setIsFullscreen(Boolean(document.fullscreenElement || fsDoc.webkitFullscreenElement));
    };
    const handleVideoFullscreenBegin = () => setIsFullscreen(true);
    const handleVideoFullscreenEnd = () => setIsFullscreen(false);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    const video = videoRef.current;
    video?.addEventListener('webkitbeginfullscreen', handleVideoFullscreenBegin);
    video?.addEventListener('webkitendfullscreen', handleVideoFullscreenEnd);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      video?.removeEventListener('webkitbeginfullscreen', handleVideoFullscreenBegin);
      video?.removeEventListener('webkitendfullscreen', handleVideoFullscreenEnd);
    };
  }, []);
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.readyState < video.HAVE_FUTURE_DATA) pendingPlayIntentRef.current = true;
      await video.play().catch(() => undefined);
    } else {
      pendingPlayIntentRef.current = false;
      video.pause();
    }
  };
  const handleReadyToPlay = () => {
    setBuffering(false);
    if (pendingPlayIntentRef.current) {
      pendingPlayIntentRef.current = false;
      videoRef.current?.play().catch(() => undefined);
    }
  };
  const handleSeek = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };
  const skip = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const limit = duration || video.duration || Infinity;
    const next = Math.min(Math.max(video.currentTime + deltaSeconds, 0), limit);
    video.currentTime = next;
    setCurrentTime(next);
  };
  const toggleFullscreen = async () => {
    const container = frameRef.current;
    const video = videoRef.current as FullscreenVideoElement | null;
    const fsDoc = document as FullscreenDocument;
    if (document.fullscreenElement || fsDoc.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (fsDoc.webkitExitFullscreen) await fsDoc.webkitExitFullscreen();
      return;
    }
    if (video?.webkitDisplayingFullscreen) {
      video.webkitExitFullscreen?.();
      return;
    }
    if (container?.requestFullscreen) {
      await container.requestFullscreen();
      return;
    }
    if (video && typeof video.webkitEnterFullscreen === 'function') {
      video.webkitEnterFullscreen();
    }
  };
  const handleError = () => { if (onPlaybackError) onPlaybackError(); else setError(true); };

  if (error) return <div role="alert" className={`flex w-full items-center justify-center bg-primary-950 p-8 text-center text-primary-100 ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>This video could not be played. Please try again.</div>;

  return <div ref={frameRef} className={`group relative w-full overflow-hidden bg-black shadow-lg ${fill ? 'h-full' : 'aspect-video rounded-xl'}`}>
    <video ref={videoRef} src={src} poster={poster} title={title} aria-label={title || 'Tutiba video'} autoPlay={autoPlay} playsInline preload="metadata" controls={false} controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture onClick={() => void togglePlayback()} onPlay={() => { setPlaying(true); onPlaybackStateChange?.(true); }} onPlaying={() => setBuffering(false)} onPause={() => { setPlaying(false); onPlaybackStateChange?.(false); }} onWaiting={() => setBuffering(true)} onCanPlay={handleReadyToPlay} onLoadedData={handleReadyToPlay} onSeeked={() => setBuffering(false)} onLoadedMetadata={event => { const videoElement = event.currentTarget; setDuration(videoElement.duration || 0); if (startAt !== undefined) { videoElement.currentTime = startAt; setCurrentTime(startAt); } if (resumePlaying) void videoElement.play().catch(() => undefined); }} onDurationChange={event => setDuration(event.currentTarget.duration || 0)} onProgress={event => setBufferedRanges(getBufferedRanges(event.currentTarget))} onTimeUpdate={event => { setCurrentTime(event.currentTarget.currentTime); onTimeUpdate?.(event.currentTarget.currentTime); }} onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)} onEnded={() => { setPlaying(false); onEnded?.(); }} onError={handleError} className="h-full w-full object-contain" />
    {buffering && <div role="status" aria-label="Loading video" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary-950/35"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-300/30 bg-primary-950/80 shadow-xl backdrop-blur"><span className="h-7 w-7 animate-spin rounded-full border-[3px] border-accent-200 border-t-accent-600" /></span></div>}
    {reconnecting && <div role="status" aria-label="Reconnecting" className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center"><span className="rounded-full bg-primary-950/85 px-3 py-1 text-xs font-semibold text-primary-100 shadow-lg backdrop-blur">Reconnecting…</span></div>}
    {controls === 'full' && !playing && !buffering && <button type="button" onClick={() => void togglePlayback()} aria-label="Play video" className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-600/95 text-white shadow-2xl transition hover:scale-105 hover:bg-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-300/60 sm:h-16 sm:w-16"><Play className="h-6 w-6 fill-current ms-1 sm:h-7 sm:w-7" /></button>}
    {controls === 'playback-only' ? <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-primary-950 via-primary-950/70 to-transparent px-3 pb-3 pt-10 text-white">
      <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-11 min-w-11 items-center justify-center rounded-full bg-primary-950/80 px-4 shadow-lg backdrop-blur hover:bg-primary-950 focus:outline-none focus:ring-4 focus:ring-accent-300/60">{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ms-0.5" />}</button>
    </div> : <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-primary-950 via-primary-950/85 to-transparent px-3 pb-2 pt-6 text-white md:px-5 md:pb-3 md:pt-8">
      <Scrubber currentTime={currentTime} duration={duration} buffered={bufferedRanges} onSeek={handleSeek} formatTime={formatTime} />
      <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={() => skip(-10)} aria-label="Rewind 10 seconds" className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"><RotateCcw className="h-4 w-4" /><span aria-hidden="true" className="pointer-events-none absolute text-[8px] font-bold leading-none">10</span></button>
        <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
        <button type="button" onClick={() => skip(10)} aria-label="Forward 10 seconds" className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"><RotateCw className="h-4 w-4" /><span aria-hidden="true" className="pointer-events-none absolute text-[8px] font-bold leading-none">10</span></button>
        <button type="button" onClick={() => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setVolume(videoRef.current.muted ? 0 : videoRef.current.volume); }} aria-label={volume === 0 ? 'Unmute video' : 'Mute video'} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        <label className="hidden sm:block"><span className="sr-only">Volume</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const next = Number(event.target.value); if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = next; } setVolume(next); }} className="w-24 accent-accent-500" /></label>
        <button type="button" onClick={() => setShowRemaining(value => !value)} aria-label={showRemaining ? 'Show elapsed and total time' : 'Show remaining time'} className="ml-1 text-xs font-semibold tabular-nums text-primary-100 hover:text-white">{showRemaining ? `-${formatTime(Math.max(duration - currentTime, 0))}` : `${formatTime(currentTime)} / ${formatTime(duration)}`}</button>
        <div className="ml-auto flex items-center gap-1">
          <SpeedMenu rate={playbackRate} onChange={setPlaybackRate} />
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</button>
        </div>
      </div>
    </div>}
  </div>;
}

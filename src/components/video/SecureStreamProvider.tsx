import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { useAuth } from '../../contexts/AuthContext';

const STREAM_URL_TTL_MS = 90 * 60 * 1000;
// Renew this long before the signed stream token actually expires, so a fresh URL
// is ready before playback can hit a 401 from the Worker.
const RENEWAL_MARGIN_MS = 3 * 60 * 1000;
const MIN_RENEWAL_DELAY_MS = 5 * 1000;
const RENEWAL_RETRY_DELAY_MS = 15 * 1000;
const MAX_RENEWAL_ATTEMPTS = 5;
const streamRequests = new Map<string, { promise: Promise<StreamRequestResult>; expiresAt: number }>();
const API_BASE_URL = String(
  import.meta.env?.VITE_API_BASE_URL || (import.meta.env?.PROD ? 'https://tutiba-video-stream.tutiba.workers.dev' : ''),
).replace(/\/$/, '');

export type SecureVideoRequest =
  | { lessonId: string; asset?: never; courseId?: never }
  | { lessonId?: never; asset: 'homepage-intro'; courseId?: never }
  | { lessonId?: never; asset: 'course-trailer'; courseId: string };

interface StreamRequestResult {
  url: string;
  expiresAt: number;
}

// The signed streaming token is a JWT; its payload is base64url, not encrypted, so
// reading `exp` client-side is safe. This is only used to schedule renewal, never
// to grant access — the Worker independently verifies the signature and expiry.
function decodeJwtExpiryMs(jwt: string): number | null {
  try {
    const payloadSegment = jwt.split('.')[1];
    if (!payloadSegment) return null;
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isSessionExpiredError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /session expired|unauthor|forbidden|invalid or expired streaming token/i.test(message);
}

async function requestStreamUrl(requestTarget: SecureVideoRequest, token?: string | null, forceRefresh = false): Promise<StreamRequestResult> {
  const targetKey = requestTarget.lessonId || `${requestTarget.asset}:${'courseId' in requestTarget ? requestTarget.courseId || '' : ''}`;
  const key = `${token || 'public'}:${targetKey}`;
  if (forceRefresh) streamRequests.delete(key);
  const cached = streamRequests.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  if (cached) streamRequests.delete(key);
  const request = fetch(`${API_BASE_URL}/api/video/token`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(requestTarget) })
    .then(async response => {
      const payload = await response.json().catch(() => ({})) as { token?: string; error?: string; correlationId?: string };
      if (!response.ok || !payload.token) throw new Error(payload.error ? `${payload.error}${payload.correlationId ? ` (Reference: ${payload.correlationId})` : ''}` : `Failed to authorize the stream (${response.status}).`);
      const expiresAt = decodeJwtExpiryMs(payload.token) ?? (Date.now() + STREAM_URL_TTL_MS);
      return { url: `${API_BASE_URL}/api/video/stream?token=${encodeURIComponent(payload.token)}`, expiresAt };
    })
    .catch(error => { streamRequests.delete(key); throw error; });
  streamRequests.set(key, { promise: request, expiresAt: Date.now() + STREAM_URL_TTL_MS });
  return request;
}

export function prefetchSecureStream(lessonId: string, token: string | null | undefined) {
  if (token) void requestStreamUrl({ lessonId }, token).catch(() => undefined);
}

export function prefetchHomepageIntroStream() {
  void requestStreamUrl({ asset: 'homepage-intro' }, null).catch(() => undefined);
}

type SecureStreamProviderProps = SecureVideoRequest & {
  title?: string;
  poster?: string;
  onEnded?: () => void;
  publicPreview?: boolean;
  autoPlay?: boolean;
  fill?: boolean;
  controls?: 'full' | 'playback-only';
  /** Seconds to seek to on the very first load (cross-session resume), not on token renewal. */
  initialPositionSeconds?: number;
  /** Skip the initial resume seek if it lands within this many seconds of the video's end. */
  resumeSkipThresholdSeconds?: number;
  /** Forwarded in addition to this component's own renewal-tracking. */
  onTimeUpdate?: (time: number) => void;
  onPlaybackStateChange?: (playing: boolean) => void;
};

export const SecureStreamProvider: React.FC<SecureStreamProviderProps> = ({ lessonId, asset, courseId, title, poster, onEnded, publicPreview = false, autoPlay = false, fill = false, controls, initialPositionSeconds, resumeSkipThresholdSeconds, onTimeUpdate: onExternalTimeUpdate, onPlaybackStateChange: onExternalPlaybackStateChange }) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [resumeAt, setResumeAt] = useState<number | undefined>(undefined);
  const [resumePlaying, setResumePlaying] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const renewalTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const renewingRef = useRef(false);
  const renewFnRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    clearTimeout(renewalTimerRef.current);

    const requestTarget: SecureVideoRequest = lessonId
      ? { lessonId }
      : asset === 'course-trailer'
        ? { asset, courseId: courseId! }
        : { asset: 'homepage-intro' };

    const scheduleRenewal = (expiresAt: number) => {
      clearTimeout(renewalTimerRef.current);
      const delay = Math.max(expiresAt - Date.now() - RENEWAL_MARGIN_MS, MIN_RENEWAL_DELAY_MS);
      renewalTimerRef.current = setTimeout(() => { void renew(); }, delay);
    };

    const renew = async () => {
      if (!isMounted || renewingRef.current) return;
      renewingRef.current = true;
      setReconnecting(true);
      try {
        if (!token && !publicPreview) throw new Error('Your session expired. Sign in to keep watching.');
        const { url, expiresAt } = await requestStreamUrl(requestTarget, token, true);
        if (!isMounted) return;
        attempts = 0;
        setResumeAt(currentTimeRef.current);
        setResumePlaying(wasPlayingRef.current);
        setStreamUrl(url);
        setError(null);
        setSessionExpired(false);
        scheduleRenewal(expiresAt);
      } catch (err) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) {
          setSessionExpired(true);
          setError('Your session has expired. Sign in again to keep watching — playback will resume where you left off.');
        } else {
          attempts += 1;
          if (attempts >= MAX_RENEWAL_ATTEMPTS) {
            setError('Lost connection to the video stream. Please try again.');
          } else {
            renewalTimerRef.current = setTimeout(() => { void renew(); }, RENEWAL_RETRY_DELAY_MS);
          }
        }
      } finally {
        if (isMounted) setReconnecting(false);
        renewingRef.current = false;
      }
    };
    renewFnRef.current = renew;

    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);
        setSessionExpired(false);

        if (!token && !publicPreview) throw new Error('Your session expired. Sign in and try again.');
        const { url, expiresAt } = await requestStreamUrl(requestTarget, token);
        if (isMounted) {
          setStreamUrl(url);
          setResumeAt(initialPositionSeconds);
          setResumePlaying(false);
          setLoading(false);
          scheduleRenewal(expiresAt);
        }
      } catch (err: any) {
        if (isMounted) {
          if (isSessionExpiredError(err)) setSessionExpired(true);
          setError(err.message || 'An unexpected error occurred');
          setLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
      clearTimeout(renewalTimerRef.current);
    };
  }, [asset, courseId, lessonId, publicPreview, token, retryVersion]);

  const handlePlaybackError = useCallback(() => {
    void renewFnRef.current?.();
  }, []);

  if (loading) {
    return (
      <div className={`${fill ? 'h-full' : 'aspect-video'} flex w-full items-center justify-center bg-primary-950`}>
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-300/30 bg-primary-900 shadow-xl"><div className="h-7 w-7 animate-spin rounded-full border-[3px] border-accent-200 border-t-accent-600" /></div>
          <p className="mt-4 text-sm font-semibold text-primary-100">Preparing your video…</p>
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className={`${fill ? 'h-full' : 'aspect-video'} flex w-full items-center justify-center bg-slate-900 p-6 text-center`}>
        <div className="max-w-md">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Sign in to keep watching</h3>
          <p className="text-slate-400 text-sm mb-6">{error || 'Your session has expired. Sign in again to continue — playback will resume where you left off.'}</p>
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-md transition-colors text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className={`${fill ? 'h-full' : 'aspect-video'} flex w-full items-center justify-center bg-slate-900 p-6 text-center`}>
        <div className="max-w-md">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Streaming Error</h3>
          <p className="text-slate-400 text-sm mb-6">{error || 'Failed to initialize stream.'}</p>
          <button
            onClick={() => { streamRequests.delete(`${token || 'public'}:${lessonId || `${asset}:${courseId || ''}`}`); setRetryVersion(value => value + 1); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={streamUrl}
      title={title}
      poster={poster}
      onEnded={onEnded}
      autoPlay={autoPlay}
      fill={fill}
      controls={controls ?? 'full'}
      startAt={resumeAt}
      resumePlaying={resumePlaying}
      resumeSkipThresholdSeconds={resumeSkipThresholdSeconds}
      reconnecting={reconnecting}
      onTimeUpdate={time => { currentTimeRef.current = time; onExternalTimeUpdate?.(time); }}
      onPlaybackStateChange={playing => { wasPlayingRef.current = playing; onExternalPlaybackStateChange?.(playing); }}
      onPlaybackError={handlePlaybackError}
    />
  );
};

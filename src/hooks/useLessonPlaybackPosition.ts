import { useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { resolvePlaybackStartAt } from '../domain/videoResume';

const SAVE_INTERVAL_MS = 8000;
const RESUME_SKIP_THRESHOLD_SECONDS = 15;

interface UseLessonPlaybackPositionArgs {
  userId: string | undefined;
  courseId: string | undefined;
  lessonId: string;
  initialPositionSeconds: number | null | undefined;
  enabled?: boolean;
}

interface UseLessonPlaybackPositionResult {
  /** Seconds to seek to once metadata loads, or undefined when there's nothing to resume. */
  startAt: number | undefined;
  /** Skip the initial seek if it lands within this many seconds of the video's end. */
  resumeSkipThresholdSeconds: number;
  onTimeUpdate: (time: number) => void;
  onPlaybackStateChange: (playing: boolean) => void;
}

/**
 * Persists a student's playback position for a lesson so they can resume it in a
 * later session. Writes are debounced during playback, flushed immediately on pause,
 * and flushed once more when the lesson unmounts (lesson switch or navigation away).
 */
export function useLessonPlaybackPosition({
  userId,
  courseId,
  lessonId,
  initialPositionSeconds,
  enabled = true,
}: UseLessonPlaybackPositionArgs): UseLessonPlaybackPositionResult {
  const latestTimeRef = useRef(0);
  const lastSavedAtRef = useRef(0);
  const lastSavedSecondsRef = useRef(-1);

  const canPersist = enabled && Boolean(userId) && Boolean(courseId);

  const persistPosition = useCallback((time: number) => {
    if (!userId || !courseId) return;
    const seconds = Math.max(0, Math.floor(time));
    if (seconds === lastSavedSecondsRef.current) return;
    lastSavedSecondsRef.current = seconds;
    lastSavedAtRef.current = Date.now();
    void supabase
      .from('lesson_progress')
      .upsert(
        { user_id: userId, course_id: courseId, lesson_id: lessonId, last_position_seconds: seconds },
        { onConflict: 'user_id,lesson_id' }
      )
      .then(({ error }) => {
        if (error) console.error('Error saving playback position:', error);
      });
  }, [userId, courseId, lessonId]);

  const onTimeUpdate = useCallback((time: number) => {
    latestTimeRef.current = time;
    if (!canPersist) return;
    if (Date.now() - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
      persistPosition(time);
    }
  }, [canPersist, persistPosition]);

  const onPlaybackStateChange = useCallback((playing: boolean) => {
    if (!playing && canPersist) {
      persistPosition(latestTimeRef.current);
    }
  }, [canPersist, persistPosition]);

  useEffect(() => {
    return () => {
      if (canPersist) persistPosition(latestTimeRef.current);
    };
    // Flush only on lesson switch / unmount, not on every dependency change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, canPersist]);

  const startAt = useMemo(() => resolvePlaybackStartAt(initialPositionSeconds), [initialPositionSeconds]);

  return { startAt, resumeSkipThresholdSeconds: RESUME_SKIP_THRESHOLD_SECONDS, onTimeUpdate, onPlaybackStateChange };
}

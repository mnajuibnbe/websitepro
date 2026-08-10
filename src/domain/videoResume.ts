/**
 * Decides whether a saved playback position is worth resuming into.
 * NULL/undefined means "never started" and 0 means "started at 0:00" — neither is
 * worth a seek, so only a strictly positive saved position becomes a resume target.
 */
export function resolvePlaybackStartAt(savedPositionSeconds: number | null | undefined): number | undefined {
  if (savedPositionSeconds == null || savedPositionSeconds <= 0) return undefined;
  return savedPositionSeconds;
}

/**
 * Decides whether an initial resume seek should be skipped because it lands within
 * `thresholdSeconds` of the video's end, so a finished video doesn't reopen at the
 * very end. An unknown duration (0 or not finite) never triggers a skip.
 */
export function shouldSkipNearEndResume(loadedDurationSeconds: number, startAtSeconds: number, thresholdSeconds: number): boolean {
  if (!Number.isFinite(loadedDurationSeconds) || loadedDurationSeconds <= 0) return false;
  return loadedDurationSeconds - startAtSeconds < thresholdSeconds;
}

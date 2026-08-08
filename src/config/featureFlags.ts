/**
 * Central switch for features that are fully built but currently hidden from
 * students/the public because they have no real usage yet. Flip a flag to
 * `true` to restore that feature immediately — no other code changes needed.
 * See FEATURE_FLAGS.md for what each flag hides and why.
 */
export const FEATURE_FLAGS = {
  assignments: false,
  instructorProgramme: false,
  newsletter: false,
  certificates: false,
} as const;

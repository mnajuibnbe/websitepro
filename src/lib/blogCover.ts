import { processCoverImage, type ProcessedCoverImage } from './courseCover';

/** Same 16:9 budget as course covers (src/lib/courseCover.ts) -- shared visual system, shared storage contract. */
export const BLOG_COVER_WIDTH = 1600;
export const BLOG_COVER_HEIGHT = 900;
export const BLOG_COVER_MAX_BYTES = 700 * 1024;
export const BLOG_COVER_MIN_WIDTH = 800;
export const BLOG_COVER_MIN_HEIGHT = 450;

export function processBlogCover(file: File): Promise<ProcessedCoverImage> {
  return processCoverImage(file, { width: BLOG_COVER_WIDTH, height: BLOG_COVER_HEIGHT, maxBytes: BLOG_COVER_MAX_BYTES, minWidth: BLOG_COVER_MIN_WIDTH, minHeight: BLOG_COVER_MIN_HEIGHT });
}

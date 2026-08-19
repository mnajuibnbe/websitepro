import { canvasBlob, type ProcessedCoverImage } from './courseCover';

/**
 * Unlike course/blog covers (which crop to a fixed 16:9), the instructor photo renders with
 * object-contain inside a square frame -- the source artwork's own aspect ratio is preserved,
 * only downscaled and re-encoded to WebP.
 */
export const INSTRUCTOR_PHOTO_MAX_DIMENSION = 1200;
export const INSTRUCTOR_PHOTO_MAX_BYTES = 500 * 1024;
export const INSTRUCTOR_PHOTO_MIN_DIMENSION = 300;

export async function processInstructorPhoto(file: File): Promise<ProcessedCoverImage> {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < INSTRUCTOR_PHOTO_MIN_DIMENSION || bitmap.height < INSTRUCTOR_PHOTO_MIN_DIMENSION) {
      throw new Error(`Use an image at least ${INSTRUCTOR_PHOTO_MIN_DIMENSION} × ${INSTRUCTOR_PHOTO_MIN_DIMENSION} pixels.`);
    }
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error('The image dimensions are too large to process safely.');

    let width = bitmap.width;
    let height = bitmap.height;
    if (width > INSTRUCTOR_PHOTO_MAX_DIMENSION || height > INSTRUCTOR_PHOTO_MAX_DIMENSION) {
      const scale = INSTRUCTOR_PHOTO_MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    let blob: Blob | null = null;
    for (const scale of [1, 0.9, 0.8, 0.7]) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('Image optimization is unavailable.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.8, 0.74, 0.68]) {
        blob = await canvasBlob(canvas, quality);
        if (blob.type !== 'image/webp') throw new Error('This browser cannot create optimized WebP images.');
        if (blob.size <= INSTRUCTOR_PHOTO_MAX_BYTES) {
          return { blob, width: canvas.width, height: canvas.height, originalBytes: file.size, processedBytes: blob.size };
        }
      }
    }
    if (!blob) throw new Error('The image could not be optimized.');
    throw new Error('The optimized image is still too large. Choose a less complex image.');
  } finally {
    bitmap.close();
  }
}

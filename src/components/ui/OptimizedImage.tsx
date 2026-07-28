import type { ComponentPropsWithoutRef } from 'react';

type OptimizedImageProps = ComponentPropsWithoutRef<'img'> & { displayWidth?: number; priority?: boolean };

function optimizeSource(src: string | undefined, width: number) {
  if (!src || !src.includes('images.unsplash.com')) return src;
  const url = new URL(src);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('q', '75');
  url.searchParams.set('w', String(width));
  return url.toString();
}

export function OptimizedImage({ src, displayWidth = 800, priority = false, alt = '', ...props }: OptimizedImageProps) {
  const optimized = optimizeSource(src, displayWidth);
  return <img {...props} src={optimized} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />;
}

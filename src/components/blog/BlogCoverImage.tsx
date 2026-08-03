import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';

interface BlogCoverImageProps {
  src: string | null;
  alt: string;
  className?: string;
  displayWidth?: number;
  priority?: boolean;
}

export function BlogCoverImage({ src, alt, className = '', displayWidth = 800, priority = false }: BlogCoverImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <div role="img" aria-label={`${alt} cover image unavailable`} className={`flex h-full w-full items-center justify-center bg-primary-100 text-primary-400 ${className}`}><BookOpen className="h-12 w-12" aria-hidden="true" /></div>;
  }

  return <OptimizedImage src={src} alt={alt} displayWidth={displayWidth} priority={priority} onError={() => setFailed(true)} className={className} />;
}

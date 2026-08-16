import { SecureStreamProvider } from '../video/SecureStreamProvider';
import type { BlogVideoProvider } from '../../lib/blogContentSegments';
import { parseYoutubeVideoId } from '../../domain/videoUrl';

interface BlogPostVideoEmbedProps {
  postId: number;
  blockIndex: number;
  provider: BlogVideoProvider;
  url: string;
  title: string;
}

export function BlogPostVideoEmbed({ postId, blockIndex, provider, url, title }: BlogPostVideoEmbedProps) {
  if (provider === 'youtube') {
    const videoId = parseYoutubeVideoId(url);
    if (!videoId) return null;
    return (
      <div className="my-6 aspect-video overflow-hidden rounded-2xl border border-primary-900 bg-black shadow-lg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-primary-900 shadow-lg">
      <SecureStreamProvider asset="blog-post-video" postId={postId} blockIndex={blockIndex} publicPreview title={title} />
    </div>
  );
}

import { PlayCircle, VideoOff } from 'lucide-react';
import { VideoPlayer } from '../video/VideoPlayer';
import { SecureStreamProvider } from '../video/SecureStreamProvider';

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match?.[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
}

function vimeoEmbedUrl(url: string) {
  const match = url.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function CourseTrailer({ courseId, title, trailerUrl, poster }: { courseId: string; title: string; trailerUrl: string | null; poster?: string | null }) {
  const url = trailerUrl?.trim() || '';
  const isDriveVideo = /https:\/\/(?:drive|docs)\.google\.com\//i.test(url);
  const embedUrl = url ? youtubeEmbedUrl(url) || vimeoEmbedUrl(url) : null;

  return <section className="mt-8" aria-labelledby="course-trailer-heading">
    <h2 id="course-trailer-heading" className="mb-4 flex items-center gap-2 text-xl font-bold text-primary-900">
      <PlayCircle className="h-5 w-5 text-accent-600" /> Course trailer
    </h2>
    {!url ? <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-6 text-center" style={poster ? { backgroundImage: `linear-gradient(rgba(15,23,42,.78),rgba(15,23,42,.78)),url(${poster})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}>
      <div className={poster ? 'text-white' : 'text-primary-600'}><VideoOff className="mx-auto mb-3 h-9 w-9 opacity-70" /><p className="font-bold">Trailer coming soon</p><p className="mt-1 text-sm opacity-80">Explore the curriculum below for full course details.</p></div>
    </div> : isDriveVideo ? <SecureStreamProvider asset="course-trailer" courseId={courseId} publicPreview title={`${title} course trailer`} poster={poster || undefined} /> : embedUrl ? <div className="aspect-video overflow-hidden rounded-2xl border border-primary-900 bg-black shadow-lg"><iframe src={embedUrl} title={`${title} course trailer`} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <VideoPlayer src={url} title={`${title} course trailer`} poster={poster || undefined} />}
  </section>;
}

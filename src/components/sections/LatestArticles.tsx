import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Clock3, Loader2 } from 'lucide-react';
import { fetchPublishedBlogPosts, type BlogPost } from '../../services/blogPosts.service';
import { PageContainer } from '../layout/PageContainer';
import { BlogCoverImage } from '../blog/BlogCoverImage';
import { Link, useNavigate } from 'react-router-dom';
import { Reveal } from '../ui/Reveal';
import { Button } from '../ui/Button';

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export function LatestArticles() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetchPublishedBlogPosts().then(data => { if (active) setPosts(data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (!loading && posts.length === 0) return null;
  return <section className="bg-primary-50 py-10 md:py-12"><PageContainer>
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">From the Tutiba blog</p>
      <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-primary-900 md:text-3xl">Keep learning outside the course</h2>
    </Reveal>
    {loading ? <div role="status" className="flex min-h-32 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-accent-600" /><span className="sr-only">Loading articles</span></div> : <>
      <div className="grid gap-5 md:grid-cols-3">{posts.map((post, index) => <Reveal key={post.id} delay={index * 0.06} className="h-full"><article className="group h-full overflow-hidden rounded-panel border border-primary-200 bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"><Link to={`/blog/${post.slug}`} className="flex h-full flex-col"><div className="aspect-[16/9] overflow-hidden bg-primary-100"><BlogCoverImage src={post.cover_image_url} alt={post.title} displayWidth={500} priority className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" /></div><div className="flex flex-1 flex-col p-5"><div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-eyebrow text-accent-700"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{estimateReadingTime(post.content)}</div><h3 className="mt-2 text-balance text-base font-bold text-primary-900 transition-colors duration-200 ease-out group-hover:text-accent-800">{post.title}</h3><p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-primary-600">{post.excerpt}</p><div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-accent-700">Read article <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></div></div></Link></article></Reveal>)}</div>
      <div className="mt-8 flex justify-center">
        <Button variant="secondary" className="px-8" onClick={() => navigate('/blog')}>
          Read More Articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </>}
  </PageContainer></section>;
}

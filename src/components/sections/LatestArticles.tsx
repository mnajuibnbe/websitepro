import { useEffect, useState } from 'react';
import { ArrowUpRight, Clock3, Loader2 } from 'lucide-react';
import { fetchPublishedBlogPosts, type BlogPost } from '../../services/blogPosts.service';
import { PageContainer } from '../layout/PageContainer';
import { BlogCoverImage } from '../blog/BlogCoverImage';
import { Link } from 'react-router-dom';
import { Reveal } from '../ui/Reveal';

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export function LatestArticles() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetchPublishedBlogPosts().then(data => { if (active) setPosts(data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (!loading && posts.length === 0) return null;
  return <section className="bg-primary-50 py-section-sm md:py-section"><PageContainer>
    <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
      <p className="text-sm font-bold uppercase tracking-eyebrow text-accent-700">Tutiba Insight</p>
      <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight text-primary-900 md:text-4xl">Latest articles &amp; insights</h2>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-primary-600">Practical perspectives for continued professional learning.</p>
    </Reveal>
    {loading ? <div role="status" className="flex min-h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /><span className="sr-only">Loading articles</span></div> : <div className="grid gap-6 md:grid-cols-3 lg:gap-8">{posts.map((post, index) => <Reveal key={post.id} delay={index * 0.06} className="h-full"><article className="group h-full overflow-hidden rounded-panel border border-primary-200 bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-900/10"><Link to={`/blog/${post.slug}`} className="flex h-full flex-col"><div className="aspect-[16/10] overflow-hidden bg-primary-100"><BlogCoverImage src={post.cover_image_url} alt={post.title} displayWidth={800} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" /></div><div className="flex flex-1 flex-col p-6"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-eyebrow text-accent-700"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{estimateReadingTime(post.content)}</div><h3 className="mt-3 text-balance text-xl font-bold text-primary-900 transition-colors duration-200 ease-out group-hover:text-accent-800">{post.title}</h3><p className="mt-3 line-clamp-3 flex-1 text-pretty leading-relaxed text-primary-600">{post.excerpt}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold text-accent-700">Read article <ArrowUpRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></div></div></Link></article></Reveal>)}</div>}
  </PageContainer></section>;
}

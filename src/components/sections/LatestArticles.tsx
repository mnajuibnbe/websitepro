import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { fetchPublishedBlogPosts, type BlogPost } from '../../services/blogPosts.service';
import { PageContainer } from '../layout/PageContainer';
import { BlogCoverImage } from '../blog/BlogCoverImage';
import { Link } from 'react-router-dom';

export function LatestArticles() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetchPublishedBlogPosts().then(data => { if (active) setPosts(data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (!loading && posts.length === 0) return null;
  return <section className="bg-primary-50 py-16 md:py-24"><PageContainer><div className="mb-12 text-center md:mb-16"><h2 className="text-3xl font-bold text-primary-900 md:text-4xl">Latest Articles &amp; Insights</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-primary-600">Practical perspectives for continued professional learning.</p></div>{loading ? <div role="status" className="flex min-h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /><span className="sr-only">Loading articles</span></div> : <div className="grid gap-8 md:grid-cols-3">{posts.map(post => <article key={post.id} className="group overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"><Link to={`/blog/${post.slug}`} className="block h-full"><div className="aspect-[16/10] overflow-hidden bg-primary-100"><BlogCoverImage src={post.cover_image_url} alt={post.title} displayWidth={800} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-6"><p className="text-xs font-bold uppercase tracking-eyebrow text-accent-700">Tutiba insight</p><h3 className="mt-3 text-xl font-bold text-primary-900">{post.title}</h3><p className="mt-3 line-clamp-3 leading-relaxed text-primary-600">{post.excerpt}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold text-accent-700">Read article <ArrowUpRight className="h-4 w-4" /></div></div></Link></article>)}</div>}</PageContainer></section>;
}

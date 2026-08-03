import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { PageContainer } from '../components/layout/PageContainer';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { fetchPublishedBlogPosts, type BlogPost } from '../services/blogPosts.service';

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { window.scrollTo(0, 0); let active = true; fetchPublishedBlogPosts(50).then(data => { if (active) setPosts(data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <div className="min-h-screen bg-primary-50 font-sans" dir="ltr"><MarketingNavbar /><main id="main-content" className="pb-24 pt-32"><PageContainer><div className="mb-16 text-center"><h1 className="mb-4 text-4xl font-bold text-primary-900">Blog</h1><p className="text-xl text-primary-600">Insights, research, and practical guidance for cosmeceutical professionals.</p></div>
    {loading ? <div role="status" className="flex min-h-72 items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-accent-600" /><span className="sr-only">Loading articles</span></div> : <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">{posts.map(post => <article key={post.id} className="group flex flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm transition-shadow hover:shadow-md"><Link to={`/blog/${post.slug}`} className="flex h-full flex-col">{post.cover_image_url && <div className="h-48 overflow-hidden"><OptimizedImage src={post.cover_image_url} alt={post.title} width="800" height="450" displayWidth={800} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}<div className="flex flex-1 flex-col p-6">{post.published_at && <span className="mb-4 flex items-center gap-1 text-xs text-primary-500"><Calendar className="h-4 w-4" />{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(post.published_at))}</span>}<h2 className="mb-3 text-xl font-bold leading-tight text-primary-900 transition-colors group-hover:text-accent-600">{post.title}</h2><p className="mb-6 flex-1 text-sm leading-relaxed text-primary-600">{post.excerpt}</p><span className="inline-flex items-center gap-2 font-bold text-accent-600">Read More <ArrowRight className="h-4 w-4" /></span></div></Link></article>)}</div>}
  </PageContainer></main><Footer /></div>;
}

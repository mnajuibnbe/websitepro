import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Loader2, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { PageContainer } from '../components/layout/PageContainer';
import { BlogCoverImage } from '../components/blog/BlogCoverImage';
import { fetchPublishedBlogPost, type BlogPost as BlogPostData } from '../services/blogPosts.service';
import { applyPageMeta, setStructuredData, SITE_NAME } from '../components/layout/PageMeta';

export function BlogPost() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    setLoading(true);
    setError(false);
    fetchPublishedBlogPost(slug).then(data => { if (active) { setPost(data); setError(!data); } }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    const url = `${window.location.origin}/blog/${slug}`;

    if (error || (!loading && !post)) {
      applyPageMeta({
        title: `Article Not Found | ${SITE_NAME}`,
        description: 'This article may have moved or is not published. Browse the Tutiba blog for other articles.',
        url,
        robots: 'noindex, follow',
      });
      setStructuredData('structured-data-article', null);
      return;
    }

    if (!post) return;

    const title = `${post.title} | ${SITE_NAME} Blog`;
    const description = post.excerpt || `Read ${post.title} on the Tutiba blog.`;
    const image = post.cover_image_url || undefined;

    applyPageMeta({ title, description, url, image, type: 'article' });

    setStructuredData('structured-data-article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description,
      ...(image ? { image } : {}),
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      author: { '@type': 'Organization', name: 'Tutiba Education Team' },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${window.location.origin}/images/tutiba-instructor-logo.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    });

    return () => setStructuredData('structured-data-article', null);
  }, [post, loading, error, slug]);

  const date = post?.published_at ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(post.published_at)) : null;
  return <div className="min-h-screen bg-primary-50 font-sans" dir="ltr"><MarketingNavbar /><main id="main-content" className="pb-24 pt-32"><PageContainer><div className="mx-auto max-w-4xl">
    <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-primary-500" aria-label="Breadcrumb"><Link to="/" className="transition-colors hover:text-accent-600">Home</Link><ChevronRight className="h-4 w-4" /><Link to="/blog" className="transition-colors hover:text-accent-600">Blog</Link>{post && <><ChevronRight className="h-4 w-4" /><span className="truncate font-bold text-primary-900">{post.title}</span></>}</nav>
    {loading ? <div role="status" className="flex min-h-96 items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-accent-600" /><span className="sr-only">Loading article</span></div> : error || !post ? <div className="rounded-3xl border border-primary-200 bg-white p-10 text-center"><h1 className="text-3xl font-bold text-primary-900">Article not found</h1><p className="mt-3 text-primary-600">This article may have moved or is not published.</p><Link to="/blog" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-accent-600 px-5 font-bold text-white hover:bg-accent-700">Browse all articles</Link></div> : <article className="overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-sm">
      <div className="h-64 w-full sm:h-96"><BlogCoverImage priority displayWidth={1200} src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" /></div>
      <div className="p-6 md:p-12"><div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-primary-100 pb-5 text-sm text-primary-500 md:mb-6 md:gap-6 md:pb-6">{date && <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />{date}</span>}<span className="flex items-center gap-2"><User className="h-5 w-5" />Tutiba Education Team</span></div><h1 className="mb-6 text-3xl font-bold leading-tight text-primary-900 md:mb-8 md:text-4xl">{post.title}</h1><p className="mb-8 text-xl leading-relaxed text-primary-700">{post.excerpt}</p><div className="space-y-6 text-lg leading-relaxed text-primary-800">{post.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div>
    </article>}
  </div></PageContainer></main><Footer /></div>;
}

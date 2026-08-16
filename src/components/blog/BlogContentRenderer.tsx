import { useNavigate } from 'react-router-dom';
import { splitBlogContentIntoSegments } from '../../lib/blogContentSegments';
import { BlogPostVideoEmbed } from './BlogPostVideoEmbed';

interface BlogContentRendererProps {
  postId: number;
  title: string;
  html: string;
}

/**
 * Renders sanitized article HTML, hydrating only the video blocks into a live player
 * (Google Drive needs a signed streaming token; everything else — headings, lists,
 * tables, FAQ, callout, button — is plain semantic HTML and renders as-is).
 * Also intercepts clicks on internal links so they navigate client-side through the
 * SPA router instead of doing a full page reload.
 */
export function BlogContentRenderer({ postId, title, html }: BlogContentRendererProps) {
  const navigate = useNavigate();
  const segments = splitBlogContentIntoSegments(html);

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || anchor.target === '_blank') return;
    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault();
      navigate(href);
      return;
    }
    if (href.startsWith(window.location.origin)) {
      event.preventDefault();
      navigate(href.slice(window.location.origin.length) || '/');
    }
  };

  return (
    <div className="blog-article text-lg leading-relaxed text-primary-800" onClick={onClick}>
      {segments.map((segment, index) => segment.type === 'html'
        ? <div key={index} dangerouslySetInnerHTML={{ __html: segment.html }} />
        : <BlogPostVideoEmbed key={index} postId={postId} blockIndex={segment.index} provider={segment.provider} url={segment.url} title={title} />)}
    </div>
  );
}

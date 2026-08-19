import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PUBLIC_PAGES } from '../../config/publicPages';

export const SITE_NAME = 'Tutiba';
export const DEFAULT_OG_IMAGE_PATH = '/images/tutiba-instructor-logo.png';

function exactPathRegex(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}/?$`);
}

const metadata: Array<{ match: RegExp; title: string; description: string; robots?: string; type?: 'website' | 'article' }> = [
  // Static public pages — registered once in src/config/publicPages.ts.
  ...PUBLIC_PAGES.map(({ path, title, description }) => ({ match: exactPathRegex(path), title, description })),
  { match: /^\/course\//, title: 'Course Details', description: 'Review the curriculum, instructor, outcomes, and enrollment details.' },
  { match: /^\/blog\//, title: 'Cosmeceutical Insights', description: 'Read evidence-based insights for cosmeceutical professionals.', type: 'article' },
  { match: /^\/login/, title: 'Sign In', description: 'Sign in to continue learning with Tutiba.', robots: 'noindex, nofollow' },
  { match: /^\/register/, title: 'Create an Account', description: 'Create your Tutiba learning account.', robots: 'noindex, nofollow' },
  { match: /^\/forgot-password|^\/update-password/, title: 'Account Recovery', description: 'Recover access to your Tutiba account.', robots: 'noindex, nofollow' },
  { match: /^\/(dashboard|profile|my-courses|learn|lesson|quiz|certificate|checkout|admin|instructor|unauthorized)/, title: 'Learning Portal', description: 'Tutiba secure learning portal.', robots: 'noindex, nofollow' },
];

export function setMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

export function setMetaProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function setStructuredData(id: string, schema: unknown | null) {
  const existing = document.getElementById(id);
  existing?.remove();
  if (!schema) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function applyPageMeta(options: {
  title: string;
  description: string;
  url: string;
  robots?: string;
  type?: 'website' | 'article';
  image?: string;
}) {
  const { title, description, url, robots = 'index, follow', type = 'website', image } = options;
  const resolvedImage = image || `${window.location.origin}${DEFAULT_OG_IMAGE_PATH}`;

  document.title = title;
  setMeta('description', description);
  setMeta('robots', robots);
  setCanonical(url);

  setMetaProperty('og:site_name', SITE_NAME);
  setMetaProperty('og:type', type);
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', description);
  setMetaProperty('og:url', url);
  setMetaProperty('og:image', resolvedImage);

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', resolvedImage);
}

export function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = metadata.find(({ match }) => match.test(pathname));
    const base = window.location.origin;
    const title = `${page?.title ?? 'Page Not Found'} | ${SITE_NAME}`;
    const description = page?.description ?? 'The requested Tutiba page could not be found.';
    const robots = page?.robots ?? (page ? 'index, follow' : 'noindex, follow');

    applyPageMeta({ title, description, url: `${base}${pathname}`, robots, type: page?.type });

    const organization = { '@type': 'EducationalOrganization', name: SITE_NAME, url: base, description: 'Evidence-based cosmeceutical education for professionals.' };
    const schemas: Record<string, unknown>[] = [{ '@context': 'https://schema.org', ...organization }];
    if (pathname === '/') schemas.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: base, potentialAction: { '@type': 'SearchAction', target: `${base}/courses?search={search_term_string}`, 'query-input': 'required name=search_term_string' } });
    if (pathname === '/faq') schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
      { '@type': 'Question', name: 'Who are Tutiba courses designed for?', acceptedAnswer: { '@type': 'Answer', text: 'Health, beauty, and skincare professionals seeking structured cosmeceutical education.' } },
      { '@type': 'Question', name: 'Will I receive a certificate?', acceptedAnswer: { '@type': 'Answer', text: 'Eligible completed courses award a certificate when the published requirements are met.' } },
    ] });
    setStructuredData('structured-data', schemas.length === 1 ? schemas[0] : schemas);
  }, [pathname]);

  return null;
}

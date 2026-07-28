import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const metadata: Array<{ match: RegExp; title: string; description: string; robots?: string }> = [
  { match: /^\/$/, title: 'Professional Cosmeceutical Education', description: 'Build practical, evidence-based cosmeceutical expertise with Tutiba.' },
  { match: /^\/courses/, title: 'Cosmeceutical Courses', description: 'Explore professional courses in skincare and cosmeceutical practice.' },
  { match: /^\/course\//, title: 'Course Details', description: 'Review the curriculum, instructor, outcomes, and enrollment details.' },
  { match: /^\/about/, title: 'About Tutiba', description: 'Learn about Tutiba’s mission and approach to professional education.' },
  { match: /^\/faq/, title: 'Frequently Asked Questions', description: 'Find answers about Tutiba courses, enrollment, payments, and certificates.' },
  { match: /^\/blog-post/, title: 'Cosmeceutical Insights', description: 'Read evidence-based insights for cosmeceutical professionals.' },
  { match: /^\/blog/, title: 'Tutiba Blog', description: 'Research and practical guidance for cosmeceutical professionals.' },
  { match: /^\/contact/, title: 'Contact Tutiba', description: 'Contact the Tutiba support team for course and account assistance.' },
  { match: /^\/privacy/, title: 'Privacy Policy', description: 'Learn how Tutiba handles and protects personal information.' },
  { match: /^\/terms/, title: 'Terms of Service', description: 'Review the terms that apply when using Tutiba.' },
  { match: /^\/login/, title: 'Sign In', description: 'Sign in to continue learning with Tutiba.', robots: 'noindex, nofollow' },
  { match: /^\/register/, title: 'Create an Account', description: 'Create your Tutiba learning account.', robots: 'noindex, nofollow' },
  { match: /^\/forgot-password|^\/update-password/, title: 'Account Recovery', description: 'Recover access to your Tutiba account.', robots: 'noindex, nofollow' },
  { match: /^\/(dashboard|profile|my-courses|learn|lesson|quiz|certificate|checkout|admin|unauthorized)/, title: 'Learning Portal', description: 'Tutiba secure learning portal.', robots: 'noindex, nofollow' },
];

function setMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

export function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = metadata.find(({ match }) => match.test(pathname));
    document.title = `${page?.title ?? 'Page Not Found'} | Tutiba`;
    setMeta('description', page?.description ?? 'The requested Tutiba page could not be found.');
    setMeta('robots', page?.robots ?? (page ? 'index, follow' : 'noindex, follow'));
    const existing = document.getElementById('structured-data');
    existing?.remove();
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    const base = window.location.origin;
    const organization = { '@type': 'EducationalOrganization', name: 'Tutiba', url: base, description: 'Evidence-based cosmeceutical education for professionals.' };
    const schemas: Record<string, unknown>[] = [{ '@context': 'https://schema.org', ...organization }];
    if (pathname === '/') schemas.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Tutiba', url: base, potentialAction: { '@type': 'SearchAction', target: `${base}/#/courses?search={search_term_string}`, 'query-input': 'required name=search_term_string' } });
    if (pathname === '/faq') schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
      { '@type': 'Question', name: 'Who are Tutiba courses designed for?', acceptedAnswer: { '@type': 'Answer', text: 'Health, beauty, and skincare professionals seeking structured cosmeceutical education.' } },
      { '@type': 'Question', name: 'Will I receive a certificate?', acceptedAnswer: { '@type': 'Answer', text: 'Eligible completed courses award a certificate when the published requirements are met.' } },
    ] });
    script.text = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
    document.head.appendChild(script);
    return () => script.remove();
  }, [pathname]);

  return null;
}

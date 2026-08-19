import type { ComponentType, LazyExoticComponent } from 'react';
import { lazyNamed } from '../lib/lazyNamed';

/**
 * The single source of truth for every static, public, indexable page on the
 * site. Adding a page here is the only step required — it is picked up
 * automatically by App.tsx's routing, PageMeta.tsx's title/description, and
 * the build-time sitemap.xml generator (scripts/generate-seo-files.mjs).
 *
 * Do NOT add a static public page's <Route> directly in App.tsx, or its
 * title/description directly in PageMeta.tsx — register it here instead so
 * it can't silently drift out of the sitemap the way /refund-policy once did.
 *
 * This does not cover dynamic content (course/blog post detail pages, which
 * are pulled live from the database) or private/noindex routes (dashboard,
 * admin, auth, checkout, etc.), which are intentionally excluded from the
 * sitemap and handled separately.
 */
export interface PublicPageDefinition {
  path: string;
  title: string;
  description: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  component: LazyExoticComponent<ComponentType<any>>;
}

export const PUBLIC_PAGES: readonly PublicPageDefinition[] = [
  {
    path: '/',
    title: 'Professional Cosmeceutical Education',
    description: 'Build practical, evidence-based cosmeceutical expertise with Tutiba.',
    changefreq: 'weekly',
    priority: '1.0',
    component: lazyNamed(() => import('../pages/Home'), 'Home'),
  },
  {
    path: '/courses',
    title: 'Cosmeceutical Courses',
    description: 'Explore professional courses in skincare and cosmeceutical practice.',
    changefreq: 'daily',
    priority: '0.9',
    component: lazyNamed(() => import('../pages/CoursesListing'), 'CoursesListing'),
  },
  {
    path: '/blog',
    title: 'Tutiba Blog',
    description: 'Research and practical guidance for cosmeceutical professionals.',
    changefreq: 'daily',
    priority: '0.7',
    component: lazyNamed(() => import('../pages/Blog'), 'Blog'),
  },
  {
    path: '/about',
    title: 'About Tutiba',
    description: 'Learn about Tutiba’s mission and approach to professional education.',
    changefreq: 'monthly',
    priority: '0.5',
    component: lazyNamed(() => import('../pages/About'), 'About'),
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers about Tutiba courses, enrollment, payments, and certificates.',
    changefreq: 'monthly',
    priority: '0.5',
    component: lazyNamed(() => import('../pages/FAQ'), 'FAQ'),
  },
  {
    path: '/contact',
    title: 'Contact Tutiba',
    description: 'Contact the Tutiba support team for course and account assistance.',
    changefreq: 'monthly',
    priority: '0.4',
    component: lazyNamed(() => import('../pages/ContactPage'), 'ContactPage'),
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Learn how Tutiba handles and protects personal information.',
    changefreq: 'yearly',
    priority: '0.2',
    component: lazyNamed(() => import('../pages/PrivacyPolicy'), 'PrivacyPolicy'),
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'Review the terms that apply when using Tutiba.',
    changefreq: 'yearly',
    priority: '0.2',
    component: lazyNamed(() => import('../pages/Terms'), 'Terms'),
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy',
    description: 'Review Tutiba’s refund and cancellation policy for digital courses.',
    changefreq: 'yearly',
    priority: '0.2',
    component: lazyNamed(() => import('../pages/RefundPolicy'), 'RefundPolicy'),
  },
];

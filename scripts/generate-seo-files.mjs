import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_PAGES } from '../src/config/publicPages.ts';
import { buildSitemapXml } from '../src/lib/sitemap.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Vercel injects real env vars into process.env directly at build time.
// Locally, .env.local isn't auto-loaded by tsx/node, so fill any gaps from it.
function loadDotEnvFallback(filename) {
  const filePath = join(root, filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnvFallback('.env.local');
loadDotEnvFallback('.env');

const siteUrl = process.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');
if (!siteUrl) {
  console.error('Missing VITE_SITE_URL. Set it in .env.local for local builds, or as a deployment environment variable in production.');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Cannot generate sitemap.xml.');
  process.exit(1);
}

const resolvedSupabaseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}.supabase.co`;
const supabase = createClient(resolvedSupabaseUrl, supabaseAnonKey);

// Kept in sync with the noindex routes in src/components/layout/PageMeta.tsx.
const DISALLOWED_PATHS = [
  '/dashboard', '/profile', '/my-courses', '/learn', '/lesson', '/quiz',
  '/certificate', '/checkout', '/admin', '/instructor', '/unauthorized',
  '/login', '/register', '/forgot-password', '/update-password',
];

async function main() {
  const [{ data: courses, error: coursesError }, { data: posts, error: postsError }] = await Promise.all([
    supabase.from('courses').select('id, updated_at').eq('status', 'published').or('visibility.eq.public,visibility.is.null'),
    supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
  ]);

  if (coursesError) throw coursesError;
  if (postsError) throw postsError;

  const entries = [
    ...PUBLIC_PAGES.map((page) => ({ path: page.path, changefreq: page.changefreq, priority: page.priority })),
    ...(courses || []).map((course) => ({ path: `/course/${course.id}`, updatedAt: course.updated_at, changefreq: 'weekly', priority: '0.8' })),
    ...(posts || []).map((post) => ({ path: `/blog/${post.slug}`, updatedAt: post.updated_at, changefreq: 'monthly', priority: '0.6' })),
  ];

  const sitemap = buildSitemapXml(siteUrl, entries);

  const robots = [
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  const distDir = join(root, 'dist');
  await mkdir(distDir, { recursive: true });
  await writeFile(join(distDir, 'sitemap.xml'), sitemap);
  await writeFile(join(distDir, 'robots.txt'), robots);

  console.log(
    `Generated sitemap.xml (${PUBLIC_PAGES.length} static, ${(courses || []).length} courses, ${(posts || []).length} posts) and robots.txt for ${siteUrl}`,
  );
}

main().catch((err) => {
  console.error('Failed to generate SEO files:', err);
  process.exit(1);
});

export interface SitemapEntry {
  path: string;
  changefreq: string;
  priority: string;
  updatedAt?: string | null;
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function isoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function urlEntry(loc: string, lastmod: string | null, changefreq: string, priority: string): string {
  const lines = ['  <url>', `    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

export function buildSitemapXml(siteUrl: string, entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => urlEntry(`${siteUrl}${entry.path}`, isoDate(entry.updatedAt), entry.changefreq, entry.priority))
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

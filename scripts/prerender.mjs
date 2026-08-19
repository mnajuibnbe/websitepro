// Post-build prerender: crawls the built SPA with a real headless browser and
// snapshots each public route's fully-rendered HTML into the matching dist/
// path, so non-JS crawlers see real content instead of the empty CSR shell.
// This does not touch the client bootstrap (main.tsx still does a plain
// createRoot().render() on load, not hydrateRoot) — real users get a full
// client-side re-render on top of the snapshot, so there's no hydration
// mismatch to worry about; the snapshot is purely a crawler-facing artifact.
import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { PUBLIC_PAGES } from '../src/config/publicPages.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

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
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Cannot prerender dynamic routes.');
  process.exit(1);
}

const resolvedSupabaseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}.supabase.co`;
const supabase = createClient(resolvedSupabaseUrl, supabaseAnonKey);

const STATIC_ROUTES = PUBLIC_PAGES.map((page) => page.path);

// Third-party beacons we don't want firing (and polluting real analytics/
// error dashboards) during a build-time crawl, and that could otherwise
// stall the "settled" wait if they keep a connection open.
const BLOCKED_REQUEST_HOSTS = [/googletagmanager\.com$/, /google-analytics\.com$/, /\.ingest\.(?:us\.)?sentry\.io$/, /doubleclick\.net$/];

const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_PORT = 4319;
const previewOrigin = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;

function outputPathForRoute(route) {
  if (route === '/') return join(distDir, 'index.html');
  const segments = route.split('/').filter(Boolean);
  return join(distDir, ...segments, 'index.html');
}

async function waitForPreview(proc) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (proc.exitCode !== null) throw new Error(`vite preview exited early with code ${proc.exitCode}`);
    try {
      const response = await fetch(previewOrigin);
      if (response.ok) return;
    } catch {
      // still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for vite preview to start');
}

async function collectRoutes() {
  const [{ data: courses, error: coursesError }, { data: posts, error: postsError }] = await Promise.all([
    supabase.from('courses').select('id').eq('status', 'published').or('visibility.eq.public,visibility.is.null'),
    supabase.from('blog_posts').select('slug').eq('status', 'published'),
  ]);

  if (coursesError) throw coursesError;
  if (postsError) throw postsError;

  const dynamicRoutes = [
    ...(courses || []).map((course) => `/course/${course.id}`),
    ...(posts || []).filter((post) => post.slug && post.slug !== 'index').map((post) => `/blog/${post.slug}`),
  ];

  return [...STATIC_ROUTES, ...dynamicRoutes];
}

// Playwright's own dependency installer (`playwright install-deps`) only
// supports Debian/Ubuntu — it has no mapping for dnf/Amazon Linux, which is
// what Vercel's build container runs. Rather than gamble on that container
// happening to have the right shared libraries preinstalled (or guessing RPM
// package names to install), Linux launches use @sparticuz/chromium: a
// Chromium build made specifically for Amazon Linux with its dependencies
// statically bundled, so there's no OS shared-library resolution involved at
// all. That binary is Linux-only, so local Windows/macOS dev keeps using
// Playwright's own downloaded Chromium (see scripts/postinstall.mjs).
async function resolveLaunchOptions() {
  if (process.platform !== 'linux') return {};
  const { default: sparticuzChromium } = await import('@sparticuz/chromium');
  return {
    executablePath: await sparticuzChromium.executablePath(),
    args: sparticuzChromium.args,
  };
}

async function launchBrowser() {
  const launchOptions = await resolveLaunchOptions();
  try {
    return await chromium.launch(launchOptions);
  } catch (err) {
    console.error('\n[prerender] Chromium failed to launch — the build cannot produce prerendered HTML without it.');
    console.error(`[prerender] Platform: ${process.platform} (using ${process.platform === 'linux' ? '@sparticuz/chromium, a dependency-free build for Amazon Linux' : "Playwright's own downloaded Chromium"}).`);
    console.error(`[prerender] Underlying error: ${err.message}`);
    if (process.platform === 'linux') {
      console.error('[prerender] This binary bundles its own shared libraries, so a launch failure here is unexpected. Check that the Node runtime is ^22.17 or >=24 (see "engines" in package.json and https://github.com/Sparticuz/chromium for current requirements), and that the build image has not changed.');
    } else {
      console.error('[prerender] Run `npx playwright install chromium` locally and retry.');
    }
    throw err;
  }
}

const MAX_SNAPSHOT_ATTEMPTS = 3;
const SNAPSHOT_RETRY_DELAY_MS = 1_000;

async function snapshotRoute(context, route) {
  const page = await context.newPage();
  try {
    await page.goto(`${previewOrigin}${route}`, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForSelector('h1', { timeout: 20_000 }).catch(() => {});
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    const rawHtml = await page.content();
    // A transient failure during the crawl (a dropped connection mid dynamic-import,
    // a slow API call outracing the waits above, etc.) trips the app's own
    // AppErrorBoundary. Without this check, that "Application error" screen gets
    // silently written to dist/ as the permanent, crawler-facing snapshot for the
    // route, and the build reports success. Retry instead of shipping that.
    if (rawHtml.includes('data-app-error-boundary="true"')) {
      throw new Error(`${route} rendered the app's error boundary instead of real content (likely a transient load failure during the crawl)`);
    }

    const html = rawHtml.split(previewOrigin).join(siteUrl);
    return html;
  } finally {
    await page.close();
  }
}

async function snapshotRouteWithRetries(context, route) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_SNAPSHOT_ATTEMPTS; attempt += 1) {
    try {
      return await snapshotRoute(context, route);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_SNAPSHOT_ATTEMPTS) {
        process.stdout.write(`retry ${attempt}/${MAX_SNAPSHOT_ATTEMPTS - 1} ... `);
        await new Promise((resolve) => setTimeout(resolve, SNAPSHOT_RETRY_DELAY_MS));
      }
    }
  }
  throw new Error(`Failed to prerender ${route} after ${MAX_SNAPSHOT_ATTEMPTS} attempts: ${lastError.message}`);
}

async function main() {
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('dist/index.html not found. Run `vite build` before scripts/prerender.mjs.');
    process.exit(1);
  }

  // Preserve the original CSR shell as the generic SPA-fallback target before
  // dist/index.html below is overwritten with the real prerendered homepage.
  // vercel.json's catch-all rewrite serves this file for any unmatched path
  // (client-only/authenticated routes, typos) — otherwise those paths would
  // start flashing homepage content instead of a neutral shell before JS
  // takes over and renders the actual page.
  await copyFile(indexPath, join(distDir, 'app-shell.html'));

  const routes = await collectRoutes();

  const preview = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let previewDiagnostics = '';
  preview.stdout.on('data', (chunk) => { previewDiagnostics += chunk; });
  preview.stderr.on('data', (chunk) => { previewDiagnostics += chunk; });

  let browser;
  const snapshots = [];

  try {
    await waitForPreview(preview).catch((error) => {
      throw new Error(`${error.message}\n${previewDiagnostics}`);
    });

    browser = await launchBrowser();

    const context = await browser.newContext();
    // Signals to client code (src/lib/prerenderFlag.ts) that this load is the
    // build-time crawl, not a real visitor, so it skips anything whose
    // result would be wrong to bake into the static snapshot every visitor
    // gets served — e.g. injecting the deferred GTM script tag once idle, or
    // swapping the preloaded font link's rel before capture.
    await context.addInitScript(() => { window.__PRERENDERING__ = true; });
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (BLOCKED_REQUEST_HOSTS.some((pattern) => pattern.test(new URL(url).hostname))) {
        return route.abort();
      }
      return route.continue();
    });

    for (const route of routes) {
      process.stdout.write(`Prerendering ${route} ... `);
      const html = await snapshotRouteWithRetries(context, route);
      snapshots.push({ route, html });
      console.log('done');
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
    preview.kill('SIGTERM');
  }

  for (const { route, html } of snapshots) {
    const outPath = outputPathForRoute(route);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
  }

  console.log(`Prerendered ${snapshots.length} route(s) into dist/.`);
}

main().catch((err) => {
  console.error('Failed to prerender routes:', err);
  process.exit(1);
});

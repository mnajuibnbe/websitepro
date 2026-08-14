// On Linux (Vercel's build container, CI), scripts/prerender.mjs launches
// Chromium via @sparticuz/chromium — a build purpose-made for Amazon Linux
// with its own dependencies statically bundled, since Playwright's own
// browser-dependency installer only supports Debian/Ubuntu and has no
// mapping for dnf/Amazon Linux. Downloading Playwright's own Chromium there
// too would just be unused bandwidth and build time on every deploy.
// On Windows/macOS (local dev), @sparticuz/chromium's binary doesn't run at
// all, so we still need Playwright's own downloaded browser.
import { execSync } from 'node:child_process';

if (process.platform === 'linux') {
  console.log('Linux detected: skipping Playwright Chromium download (scripts/prerender.mjs uses @sparticuz/chromium here instead).');
} else {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
}

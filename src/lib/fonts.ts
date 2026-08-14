import { isPrerendering } from './prerenderFlag';

// Flips the preloaded Google Fonts stylesheet link (see index.html) from
// rel="preload" to rel="stylesheet" so it applies without having blocked the
// initial render. Called from main.tsx before the app renders.
export function activatePreloadedFonts(): void {
  // Skip during the build-time prerender crawl: the resulting snapshot is
  // served as static HTML to every visitor, so it must keep the pristine
  // rel="preload" markup rather than bake in the post-swap state.
  if (isPrerendering()) return;
  const link = document.getElementById('google-fonts') as HTMLLinkElement | null;
  if (link && link.rel !== 'stylesheet') link.rel = 'stylesheet';
}

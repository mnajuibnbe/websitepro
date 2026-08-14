// Flips the preloaded Google Fonts stylesheet link (see index.html) from
// rel="preload" to rel="stylesheet" so it applies without having blocked the
// initial render. Called from main.tsx before the app renders.
export function activatePreloadedFonts(): void {
  const link = document.getElementById('google-fonts') as HTMLLinkElement | null;
  if (link && link.rel !== 'stylesheet') link.rel = 'stylesheet';
}

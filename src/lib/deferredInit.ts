// Runs `task` once the page is idle (via requestIdleCallback, capped so it
// doesn't wait forever) OR as soon as the user first interacts, whichever
// comes first — whichever fires first cancels the other. Used to keep
// non-critical third-party work (GTM, Sentry) off the initial render path
// without delaying it past the point a real user would engage anyway.
export function runWhenIdleOrInteractive(task: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    task();
  };

  const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
  const cleanup = () => {
    interactionEvents.forEach(type => window.removeEventListener(type, run));
  };
  interactionEvents.forEach(type => window.addEventListener(type, run, { once: true, passive: true }));

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 4000 });
    } else {
      setTimeout(run, 2000);
    }
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

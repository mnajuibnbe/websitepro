import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {activatePreloadedFonts} from './lib/fonts';
import {initAnalytics, loadAnalyticsScript} from './lib/analytics';
import {runWhenIdleOrInteractive} from './lib/deferredInit';

activatePreloadedFonts();
initAnalytics();

// Legacy links from the old HashRouter looked like /#/path. Redirect them to
// the equivalent clean BrowserRouter path so previously shared links keep working.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1) + window.location.search);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sentry and the GTM script itself are non-critical for first paint — both are
// deferred until the page is idle (or the user starts interacting, whichever
// is first) so they don't compete with the initial render for bandwidth/CPU.
runWhenIdleOrInteractive(() => {
  loadAnalyticsScript();
  import('./lib/sentry').then(({initSentry}) => initSentry());
});

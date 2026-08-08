import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initSentry} from './lib/sentry';

initSentry();

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

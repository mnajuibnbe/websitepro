import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// HashRouter owns the client route. If an API URL was accidentally used as
// the document base, normalize it without losing the current hash route.
if (window.location.pathname !== '/') {
  window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
